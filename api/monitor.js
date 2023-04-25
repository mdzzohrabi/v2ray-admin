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

        let downloader = http.get(path, res => {
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

        downloader.on('connect', () => tConnect = Date.now());
        downloader.on('finish', () => {
            res.json({

            })
        });
        downloader.on('error', err => {

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


module.exports = { router };