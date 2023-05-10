// @ts-check
const { randomUUID, createHash } = require('crypto');
const express = require('express');
const { env } = require('process');
const { db } = require('../lib/util');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        let {username, password} = req.body ?? {};
        /** @type {SystemUser[]} */
        let users = await db('system-users') ?? [];

        password = createHash('md5').update(password).digest('hex');

        let user = users.find(x => x.username == username && x.password == password && x.isActive);

        if (!user)
            throw Error('Authentication failed');

        /** @type {LoginSession[]} */
        let sessions = await db('sessions') ?? [];

        let sessionToken = Buffer.from(randomUUID()).toString('base64');
        let token = Buffer.from(`session:${sessionToken}`).toString('base64');

        sessions.push({
            isExpired: false,
            loginDate: Date.now(),
            token: sessionToken,
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
            res.locals.isWebToken = true;
            return next();
        }

        let sessionToken = Buffer.from(apiKey, 'base64').toString('utf-8');

        // User authentication
        if (sessionToken?.startsWith('session:')) {
            /** @type {LoginSession[]} */
            let sessions = await db('sessions') ?? [];
            let token = sessionToken.substring('session:'.length);
            let session = sessions.find(x => x.token == token && !x.isExpired);
            if (session) {
                /** @type {SystemUser[]} */
                let users = await db('system-users') ?? [];
                let user = users.find(x => x.id == session?.userId);
                if (user && user.isActive) {
                    session.lastRequestTime = Date.now();
                    session.lastRequestIP = req.socket.remoteAddress;
                    session.userAgent = req.headers['user-agent'];
                    res.locals.session = session;
                    res.locals.user = user;
                    res.locals.isUser = true;
                    // Save sessions
                    await db('sessions', sessions);
                    return next();
                }
            }
        }

        /** @type {ServerNode[]} */
        let serverNodes = await db('server-nodes') ?? [];
        let serverNode = serverNodes.find(x => x.apiKey == apiKey && !x.disabled);
        
        if (!serverNode)
            return res.status(401).json({ error: 'Api Authentication failed' });

        // Remote user information
        if (req.headers['x-user']) {
            res.locals.user = JSON.parse(Buffer.from(String(req.headers['x-user']), 'base64').toString('utf-8'));
        }

        // Remote Api Authentication
        res.locals.apiKey = apiKey;

        if (ui != 'true') {
            serverNode.lastConnectDate = new Date().toLocaleString();
            serverNode.lastConnectIP = String(req.headers['x-forwarded-for'] ?? req.ip);
            await db('server-nodes', serverNodes);
        }

        res.locals.serverNode = serverNode;
        res.locals.isNode = true;

        next();
    } catch (err) {
        res.json({ ok: false, error: err?.message });
    }
});

router.get('/authenticate', (req, res) => {
    res.json({ ok: true , message: 'You\'re authenticated', user: res.locals.user });
});

module.exports = { router };