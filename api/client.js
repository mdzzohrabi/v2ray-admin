// @ts-check
let express = require('express');
const { env } = require('process');
const { readConfig, getPaths, getUserConfig, readLogFile, DateUtil, db } = require('../lib/util');
let router = express.Router();

router.get('/configs/:id', async (req, res) => {
    let {id} = req.params;
    if (!id) return res.status(400).end('Invalid id');

    let {configPath} = getPaths();
    let config = readConfig(configPath);

    let user = config?.inbounds?.flatMap(x => x.settings?.clients ?? [])?.find(x => x.id == id);

    if (!user)
        return res.status(404).end('User not found');

    let inbounds = config?.inbounds?.filter(x => !!x?.settings?.clients?.find(x => x.id == id))?.map(x => x.tag) ?? [];

    let clientConfigs = inbounds.map(async tag => {
        // @ts-ignore
        return (await getUserConfig(user, tag)).strClientConfig;
    });

    res.end((await Promise.all(clientConfigs)).join('\n'));

    let subscribers = await db('subscribers') ?? {};

    let subscriber = subscribers[user.email ?? ''] = subscribers[user.email ?? ''] ?? {
        firstUpdate: new Date().toISOString()
    }

    subscriber.clientIP = req.headers['X-Client-IP'] ?? req.headers['x-client-ip'] ?? req.socket.remoteAddress;
    subscriber.lastUpdate = new Date().toISOString();

    await db('subscribers', subscribers);
});

router.get('/info/:id', async (req, res) => {
    let {id} = req.params;
    if (!id) return res.json({ ok: false, error: 'Invalid id' });

    let {configPath, accessLogPath} = getPaths();
    let config = readConfig(configPath);

    let user = config?.inbounds?.flatMap(x => x.settings?.clients ?? [])?.find(x => x.id == id);

    if (!user)
        return res.json({ ok: false, error: 'User not found' });

    let inbounds = config?.inbounds?.filter(x => !!x?.settings?.clients?.find(x => x.id == id))?.map(x => x.tag) ?? [];

    let clientConfigs = inbounds.map(async tag => {
        // @ts-ignore
        return (await getUserConfig(user, tag)).strClientConfig;
    });

    let usages = await readLogFile(accessLogPath);

    let configs = await Promise.all(clientConfigs);

    let usage = usages[user.email ?? ''];
    user.firstConnect = user.firstConnect ?? usage?.firstConnect;
    user['lastConnect'] = usage?.lastConnect;
    user['lastConnectNode'] = usage?.lastConnectNode;
    user['lastConnectIP'] = usage?.lastConnectIP;
    user['quotaUsage'] = usage?.quotaUsage;
    user['quotaUsageAfterBilling'] = usage?.quotaUsageAfterBilling;
    user['quotaUsageUpdate'] = usage?.quotaUsageUpdate;
    user.expireDays = user.expireDays || Number(env.V2RAY_EXPIRE_DAYS) || 30;
    user.maxConnections = user.maxConnections || Number(env.V2RAY_MAX_CONNECTIONS) || 3;
    user.billingStartDate = user.billingStartDate ?? user.firstConnect;
    user['expireDate'] = DateUtil.addDays(user.billingStartDate, user.expireDays ?? 30);

    res.json({
        ok: true,
        configs,
        user
    })

});


module.exports = { router };