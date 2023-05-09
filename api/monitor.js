// @ts-check
const { parse } = require('url');
const { httpAction, ping, db } = require('../lib/util');
const router = require('express').Router();
const stream = require('stream');
const http = require('http');
const https = require('https');
const { promisify } = require('util');

// Create fake file
router.get('/monitor/test-file', httpAction(async (req, res) => {
    let { size } = req.query;
    size = Number(size ?? 100 * (1024 ** 2)); // Default 100Mb
    if (size > 1024 * (1024 ** 2))
    throw Error('Size cannot be more than 1024mb');
    let fileContents = Buffer.alloc(size, '0');  
    res.set('Content-disposition', 'attachment; filename=fake.bin');
    res.set('Content-Type', 'text/plain');  
    console.log('Test', fileContents.length);
    res.end(fileContents);
}));

/**
 * @typedef {{
 *    id: number
 *    path: string
 *    downloaded: number 
 *    total: number
 *    status: string
 *    downloader?: http.ClientRequest
 *    avgSpeed: number
 *    minSpeed: number, maxSpeed: number, speed: number, nDownloaded: number, tStart: number, tEnd: number, tConnect: number
 *    statusCode?: number
 *    headers?: any
 * }} DownloadRequest
 *
 * @type {DownloadRequest[]}
 */
const downloadQueue = [];

router.get('/monitor/download-test', httpAction(async (req, res) => {
    const requestId = req.query.id;
    if (!requestId)
        throw Error('Invalid Request');

    let request = downloadQueue.find(x => x.id == requestId);

    if (!request)
        throw Error('Request not fuond');

    let {downloader, ...result} = request;

    res.json(result);
}));

// Download Test
router.post('/monitor/download-test', httpAction(async (req, res) => {
    const {nodeId, path: requestPath, time, size} = req.body;

    if (downloadQueue.filter(x => !!x.downloader).length > 5) throw Error(`Queue is full`);

    let path = requestPath;
    let auth = '';

    // Download test a node
    if (nodeId) {
        /** @type {ServerNode[]} */
        const nodes = await db('server-nodes') ?? [];
        const node = nodes.find(x => x.id == nodeId);
        if (!node)
            throw Error('Node not found');
        path = node.address + '/monitor/test-file?size=' + Number(size ?? 50) * 1024 * 1024;
        auth = 'Bearer ' + Buffer.from(node.apiKey).toString('base64');
    }

    if (path) {
        let tStart = Date.now();
        let tConnect, tFirstChunk = null;
        let avgSpeed = 0, minSpeed = 0, maxSpeed = 0, speed = 0;
        let nDownloaded = 0;
        let abortController = new AbortController();
        let timeout = time ? setTimeout(() => abortController.abort(), Number(time ?? 5000)) : null;

        /** @type {DownloadRequest} */
        let request = {
            id: Math.round(Math.random() * 100000),
            path,
            downloaded: 0,
            status: 'Queue',
            total: 0,
            avgSpeed, minSpeed, maxSpeed, speed, nDownloaded, tStart, tEnd: 0, tConnect: 0, headers: {}
        }

        let {default: fetch} = await import('node-fetch');
        let microS = () => {
            let hrTime = process.hrtime();
            return hrTime[0] * 1000000 + hrTime[1] / 1000;
        } 

        let downloader = fetch(path, {
            signal: abortController.signal,
            headers: {
                Authorization: auth
            }
        }).then(res => {
            console.log('OK', res.headers, Number(res.headers.get('content-length')));
            tConnect = Date.now();
            let tLastChunk = microS();
            request.tConnect = tConnect;
            request.total = Number(res.headers.get('content-length'));
            request.status = 'Connected';
            request.statusCode = 200;
            request.headers = {};
            res.headers.forEach((v, k) => {
                request.headers[k] = v;
            });
            // request.downloader = downloader;
            res.body?.on('data', (/** @type {Buffer} */ data) => {
                if (!tFirstChunk) tFirstChunk = Date.now();
                let nSize = data.length;
                let tDiff = microS() - tLastChunk;
                let scale = 1000000 / tDiff;
                speed = (nSize / tDiff) * scale;
                minSpeed = !minSpeed ? speed : Math.min(minSpeed, speed);
                maxSpeed = Math.max(maxSpeed, speed);
                avgSpeed = (avgSpeed + speed) / 2
                nDownloaded += nSize;
                request.downloaded = nDownloaded;
                request.maxSpeed = maxSpeed;
                request.minSpeed = minSpeed;
                request.speed = speed;
                request.avgSpeed = avgSpeed;
                request.status = 'Downloading';
                tLastChunk = microS();
            });

            res.body?.on('error', err => {
                console.log('ERRRR');
                request.status = 'Error: ' + err?.message;
                request.downloader = undefined;    
            });

            res.body?.on('close', () => {
                console.log('Finish');
                request.status = 'Complete';
                timeout && clearTimeout(timeout);
                let tEnd = Date.now();
                request.tEnd = tEnd;
                request.downloader = undefined;
            });
        }).catch(err => {
            request.status = 'Error: ' + err?.message;
            request.downloader = undefined;
        });

        let { downloader: _, ...result } = request;
        downloadQueue.push(request);

        res.json(result)
    }
    else {
        throw Error('Invalid request');
    }
}));

// Ping test an IP
router.post('/monitor/ping', httpAction(async (req, res) => {
    let {ip} = req.body;
    if (!ip)
        throw Error('IP not entered');

    let result = await ping(ip);

    return {
        ip,
        ping: result
    }
}));

// Ping test all nodes
router.get('/monitor/ping-nodes', async (req, res) => {
    try {
        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        let result = await Promise.all(nodes.map(async x => {
            if (!x.address) return x;
            try {
                x['ping'] = await ping(x.address);
            } catch (err) {
                x['ping'] = err?.message ?? 'Error';
            }
            return x;
        }));

        res.json(result);
    }
    catch (err) {
        res.json({ ok: false, error: err?.message ?? 'Error' });
    }
});

// V2Ray Status
router.get('/monitor/service', httpAction(async (req, res) => {
    const { exec } = require('child_process');
    exec('service v2ray status', (err, stdout, stderr) => {
        if (err) {
            throw err;
        }
        res.json({
            output: stdout ?? stderr,
            ok: true
        });
    });
}));


module.exports = { router };