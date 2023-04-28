const { db } = require('../lib/util');

// @ts-check
const router = require('express').Router();


router.get('/traffic', async (req, res) => {
    res.json(await db('traffic-usages'))
});

router.get('/daily_usages', async (req, res) => {
    try {
        let email = String(req.query.email);
        let dailyUsage = await db('daily-usages') ?? {};
        let result = Object.keys(dailyUsage).map(k => {
            let user = dailyUsage[k][email] ?? {};
            let outbounds = Object.keys(user).map(tag => ({ tag, ...user[tag] }));
            return {
                date: k,
                email,
                outbounds
            };
        });

        res.json(result);
    }
    catch (err) {
        res.end({ error: err.message });
    }
});


router.get('/daily_usage_logs', async (req, res) => {
    try {
        let email = req.query.email?.toString();
        let fromOffset = Number(req.query.from) || 0;
        let toOffset = Number(req.query.to) || null;
        let tag = req.query.tag?.toString();
        let {accessLogPath} = getPaths();
        let lines = readLogLinesByOffset(accessLogPath, fromOffset, toOffset);
        let result = [];
        let limit = Number(req.query.limit) || 50;
        let search = req.query.q?.toString();
        let skip = 0;
        let page = Number(req.query.page) || 1;
        let i = 0;

        skip = (page - 1) * limit;
        limit = skip + limit;

        if (!email || !toOffset || !fromOffset) return res.json({ error: 'Invalid request' });

        for await (let line of lines) {
            // User filter
            if (!!email && line.user != email) continue;
            // Limit
            if (i + 1 > limit) break;
            // Tag filter
            if (!!tag && line.route.replace(/\[|\]/g, '') != tag) continue;
            // Search
            if (!!search && !line.destination?.includes(search)) continue;
            i++;
            if (i > skip)
                result.push(line);
        }            

        res.json(result);
    }
    catch (err) {
        res.json({ error: err.message });
    }
});


router.get('/usages', async (req, res) => {
    let {accessLogPath} = getPaths();
    let usages = await readLogFile(accessLogPath);
    res.json(usages);
});

module.exports = { router };