// @ts-check
const { readDb, saveDb } = require('../lib/db');
const { arrSync, db, getPaths, readConfig, getUserConfig, httpAction, readLogLines, cache } = require('../lib/util');
const router = require('express').Router();

router.post('/api/sync/transactions', async (req, res) => {
    try {
        let serverNodeId = res.locals.serverNode.id;       
        let db = await readDb();

        /** @type {Transaction[]} */
        let newTransactions = [ ...(req.body ?? []) ];

        /** @type {Transaction[]} */
        let transactions = db.transactions ?? [];
        let { result: syncResult, ...syncStats } = arrSync(transactions, newTransactions.map(x => {
            x.serverNodeId = serverNodeId;
            return x;
        }), t => t.id, t => t.serverNodeId == serverNodeId, t => t.serverNodeId == serverNodeId);

        transactions = syncResult;
        db.transactions = transactions;
        await saveDb(db);

        res.json({ message: 'Transaction updated', ok: true, removed: syncStats.removed.length, inserted: syncStats.inserted.length, modified: syncStats.modified.length });
    } catch (err) {
        res.json({ ok: false, error: err?.message });
        console.log(err);
    }
});


router.post('/api/sync/traffic-usages', async (req, res) => {
    try {
        let serverNodeId = res.locals.serverNode.id;       
        /** @type {TrafficUsages} */
        let localTrafficUsages = await db('traffic-usages') ?? {};

        /** @type {TrafficUsages} */
        let remoteTrafficUsages = req.body;

        for (let remoteDate in remoteTrafficUsages) {
            let remoteUsages = remoteTrafficUsages[remoteDate];

            // Create local date
            if (!localTrafficUsages[remoteDate]) {
                localTrafficUsages[remoteDate] = [];
            }

            let localUsages = localTrafficUsages[remoteDate];

            for (let remoteUsage of remoteUsages) {
                remoteUsage.server = serverNodeId;
                let localIndex = localUsages.findIndex(x => x.type == remoteUsage.type && x.name == remoteUsage.name && x.direction == remoteUsage.direction && x.server == remoteUsage.server);
                // Update
                if (localIndex >= 0)
                    localUsages[localIndex] = remoteUsage;
                // Insert
                else
                    localUsages.push(remoteUsage);
            }
        }

        await db('traffic-usages', localTrafficUsages);

        res.json({ message: 'Traffic usages updated', ok: true });
    } catch (err) {
        res.json({ ok: false, error: err?.message });
        console.log(err);
    }
});

router.post('/api/sync/user-usages', async (req, res) => {
    try {
        let serverNodeId = res.locals.serverNode.id;       
        /** @type {UserUsages} */
        let userUsages = await db('user-usages') ?? {};

        /** @type {UserUsages} */
        let nodeUserUsages = req.body;

        for (let user in nodeUserUsages) {
            let usage = nodeUserUsages[user];
            let local = userUsages[user];
            if (!local) {
                userUsages[user] = usage;
            }
            else {
                if (usage.firstConnect && (!local.firstConnect || new Date(local.firstConnect) < new Date(usage.firstConnect) ))
                    local.firstConnect = usage.firstConnect;

                if (usage.lastConnect && (!local.lastConnect || new Date(local.lastConnect) < new Date(usage.lastConnect) )) {
                    local.lastConnect = usage.lastConnect;
                    local.lastConnectNode = serverNodeId;
                    local.lastConnectIP = usage.lastConnectIP;
                }

                let qouta = usage['quotaUsage_local'] || usage.quotaUsage;
                
                if (qouta) {
                    if (local.quotaUsage && !local['quotaUsage_local']) {
                        local['quotaUsage_local'] = local.quotaUsage;
                    }

                    local['quotaUsage_' + serverNodeId] = qouta;
                    local['quotaUsageUpdate_' + serverNodeId] = usage.quotaUsageUpdate;

                    local.quotaUsage = Object.keys(local).filter(x => x.startsWith('quotaUsage_')).map(x => local[x]).reduce((s, v) => s + v, 0);
                }
            }
        }

        await db('user-usages', userUsages);

        res.json({ message: 'User usage updated', ok: true });
    } catch (err) {
        res.json({ ok: false, error: err?.message });
        console.log(err);
    }
});

router.get('/api/clients', (req, res) => {
    try {
        let { tag } = req.query;
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        
        res.json({
            clients: config?.inbounds?.find(x => x.tag == tag)?.settings?.clients ?? []
        });
    } catch (err) {
        res.json({ ok: false, error: err?.message });
        console.log(err);
    }
});

router.post('/api/user_inbounds', async (req, res) => {
    /** @type {V2RayConfigInboundClient} */
    let user = req.body;
    if (!user || !user.id || !user.email) return res.status(500).json({ error: 'Invalid request' });
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    let inbounds = config?.inbounds?.filter(x => !!x.settings?.clients?.find(u => u.email == user.email));
    res.json(inbounds?.map(x => x.tag) ?? []);
});


router.post('/api/client_config', async (req, res) => {
    /** @type {V2RayConfigInboundClient} */
    let user = req.body;
    let tag = req.query.tag?.toString();

    if (!user || !user.id || !user.email || !tag) return res.status(500).json({ error: 'Invalid request' });

    let {strClientConfig} = await getUserConfig(user, tag);

    res.json({ config: strClientConfig });
});

router.get('/api/last_log_records', httpAction(async (req, res) => {
    const { m: rangeMinutes = 1 } = req.query;
    if (!rangeMinutes) throw Error(`Invalid time range`);
    const {accessLogPath} = getPaths();
    const lines = readLogLines(accessLogPath, `last-${rangeMinutes}-minutes-bytes`);
    const fromDate = new Date();
    fromDate.setMinutes(fromDate.getMinutes() - rangeMinutes);
    let lastMinutesRecords = await cache(`last-${rangeMinutes}-minutes`) ?? [];
    
    // Read log lines
    for await (let line of lines) {
        let {dateTime, status} = line;
        if (status != 'accepted') continue;
        if (dateTime < fromDate) continue;
        lastMinutesRecords.push(line);
    }
    
    // Old log lines from cache that is not in time range
    let removed = [];
    for (let line of lastMinutesRecords) {
        let {dateTime} = line;
        if (new Date(dateTime) < fromDate) {
            removed.push(line);
            continue;
        }
    }
    
    // Log lines that is in time-range
    lastMinutesRecords = lastMinutesRecords.filter(x => !removed.includes(x));
    
    // Cache time-ranged log lines
    await cache(`last-${rangeMinutes}-minutes`, lastMinutesRecords);

    return lastMinutesRecords;
}));

module.exports = { router };