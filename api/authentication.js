// @ts-check
const { randomUUID } = require('crypto');
const express = require('express');
const { env } = require('process');
const { db } = require('../lib/util');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        let {username, password} = req.body ?? {};
        /** @type {SystemUser[]} */
        let users = await db('system-users') ?? [];
        let user = users.find(x => x.username == username && x.password == password);

        if (!user)
            throw Error('Authentication failed');

        /** @type {LoginSession[]} */
        let sessions = await db('sessions') ?? [];

        let token = Buffer.from(`login:${Buffer.from(randomUUID()).toString('base64')}`).toString('base64');

        sessions.push({
            isExpired: false,
            loginDate: Date.now(),
            token,
            userId: user.id,
            username: user.username
        });

        // Save sessions
        await db('sessions', sessions);

        res.json({
            ok: true,
            token
        })

    }
    catch (err) {
        res.json({ ok: false, error: err?.message });
    }
});

router.use(async (req, res, next) => {
    try {
        let { headers: { authorization, ui } } = req;
        
        if (!authorization)
            return res.status(401).json({ error: `Api Authentication required` });

        let apiKey = Buffer.from(authorization?.split(' ')[1], 'base64').toString('utf-8');

        // Main Api Authentication
        if (apiKey == env.WEB_TOKEN) {
            return next();
        }

        // User authentication
        if (apiKey?.startsWith('session:')) {
            /** @type {LoginSession[]} */
            let sessions = await db('sessions') ?? [];
            let token = apiKey.substring('session:'.length);
            let session = sessions.find(x => x.token == token);
            if (session) {
                /** @type {SystemUser[]} */
                let users = await db('system-users') ?? [];
                let user = users.find(x => x.id == session?.userId);
                if (user && user.isActive) {
                    session.lastRequestTime = Date.now();
                    res.locals.session = session;
                    res.locals.user = user;
                    // Save sessions
                    await db('sessions', sessions);
                    next();
                }
            }
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
    } catch (err) {
        res.json({ ok: false, error: err?.message });
    }
});

module.exports = { router };