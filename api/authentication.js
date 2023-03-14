// @ts-check
const express = require('express');
const { env } = require('process');
const { db } = require('../lib/util');

const router = express.Router();

router.use(async (req, res, next) => {

    let { headers: { authorization, ui } } = req;
    
    if (!authorization)
        return res.status(401).json({ error: `Api Authentication required` });

    let apiKey = Buffer.from(authorization?.split(' ')[1], 'base64').toString('utf-8');

    // Main Api Authentication
    if (apiKey == env.WEB_TOKEN) {
        return next();
    }

    // Remote Api Authentication

    res.locals.apiKey = apiKey;

    /** @type {ServerNode[]} */
    let serverNodes = await db('server-nodes') ?? [];

    let serverNode = serverNodes.find(x => x.apiKey == apiKey && !x.disabled);

    if (!serverNode)
        return res.status(401).json({ error: 'Api Authentication failed' });

    if (ui != 'true') {
        serverNode.lastConnectDate = new Date().toLocaleString();
        serverNode.lastConnectIP = req.ip;
        await db('server-nodes', serverNodes);
    }

    res.locals.serverNode = serverNode;

    next();
});

module.exports = { router };