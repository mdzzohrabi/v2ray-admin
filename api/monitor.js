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
    if (size > 200 * (1024 ** 2))
        throw Error('Size cannot be more than 200mb');
    let fileContents = Buffer.alloc(size, '0');  
    res.set('Content-disposition', 'attachment; filename=fake.bin');
    res.set('Content-Type', 'text/plain');  
    res.end(fileContents);
}));

// Download Test
router.post('/monitor/download-test', httpAction(async (req, res) => {
    const {nodeId, path, time} = req.body;

    // Download test a node
    if (nodeId) {
        /** @type {ServerNode[]} */
        const nodes = await db('server-nodes') ?? [];
        const node = nodes.find(x => x.id == nodeId);
        if (!node)
            throw Error('Node not found');
        const path = node.address + '/monitor/test-file?size=' + 50 * 1024 * 1024;        
    }

    if (path) {
        let tStart = Date.now();
        let tConnect, tFirstChunk = null;
        let avgSpeed, minSpeed, maxSpeed, speed = 0;
        let nDownloaded = 0;
        let abortController = new AbortController();
        let timeout = time ? setTimeout(() => abortController.abort(), Number(time ?? 5000)) : null;

        // Downloader
        let downloader = https.get(path, res => {
            tConnect = Date.now();
            let tLastChunk = Date.now();
            res.on('data', (/** @type {Buffer} */ buffer) => {
                if (!tFirstChunk) tFirstChunk = Date.now();
                let nSize = buffer.length;
                speed = nSize / Date.now() - tLastChunk;
                minSpeed = Math.min(minSpeed, speed);
                maxSpeed = Math.max(maxSpeed, speed);
                avgSpeed = (avgSpeed + speed) / 2
                nDownloaded += nSize;
            });
        });

        // Timeout
        abortController.signal.addEventListener('abort', () => {
            downloader.destroy(Error(`Timeout`));
        });

        downloader.on('connect', () => tConnect = Date.now());
        downloader.once('finish', () => {
            timeout && clearTimeout(timeout);
            let tEnd = Date.now();
            res.json({
                path,
                avgSpeed, minSpeed, maxSpeed, speed, nDownloaded, tStart, tEnd, tConnect
            })
        });
        downloader.once('error', err => {
            res.json({
                error: err?.message,
                ok: false
            })
        });
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