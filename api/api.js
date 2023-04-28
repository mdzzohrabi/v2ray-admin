// @ts-check
const { randomUUID } = require('crypto');
const { env } = require('process');
const { getTransactions } = require('../lib/db');
const { getPaths, readConfig, applyChanges, writeConfig, readLogFile, getUserConfig, restartService, DateUtil, db, createLogger, httpAction } = require('../lib/util');
const { statusFilters } = require('./common');
const router = require('express').Router();

let {showInfo, showError} = createLogger();


router.get('/config', async (req, res) => {
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    config?.inbounds?.map(x => {
        if (x.settings) {
            x.settings['clientsLength'] = x.settings?.clients?.length;
            x.settings.clients = [];
        }
    })
    res.json(config);
});

router.post('/config', async (req, res) => {
    let {changes} = req.body;
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    let newConfig = applyChanges(config, changes);
    await writeConfig(configPath, newConfig);
    res.json({ ok: true });
});


router.post('/client_config', async (req, res) => {
    /** @type {V2RayConfigInboundClient} */
    let user = req.body;
    let tag = req.query.tag?.toString();

    if (!user || !user.id || !user.email || !tag) return res.status(500).json({ error: 'Invalid request' });

    let {strClientConfig} = await getUserConfig(user, tag);

    res.json({ config: strClientConfig });
});


router.get('/summary', async (req, res) => {
    try {
        /** @type {SystemUser?} */
        let systemUser = res.locals.user;
        let showAll = (systemUser?.acls?.isAdmin ? 'true' : 'false') ?? req.query.showAll;

        let {configPath, accessLogPath} = getPaths();
        let config = readConfig(configPath);
        let usages = await readLogFile(accessLogPath);
        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];
        /** @type {TrafficUsages} */
        let traffics = await db('traffic-usages') ?? {};
        let transactions = await getTransactions();

        /** @type {V2RayConfigInboundClient[]} */
        let users = config?.inbounds
            // Filter based on allowed inbounds
            ?.filter(x => systemUser?.acls?.isAdmin || (x.tag && systemUser?.acls?.allowedInbounds?.includes(x.tag)))
            // Unwind clients
            .flatMap(x => x.settings?.clients ?? [])
            // Private users
            .filter(x => systemUser?.acls?.isAdmin || systemUser?.acls?.users?.privateUsers || !x.private)
            // Owned users
            .filter(x => systemUser?.acls?.isAdmin || systemUser?.acls?.users?.allUsers || x.createdById == systemUser?.id)
            .map(user => {
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
                return user;
            }) ?? [];

        let userCounts = {};
        for (let filter in statusFilters)
            userCounts[filter.replace(/\W+/g, '_').replace(/_$/, '').replace(/^_/, '')] = users.filter(statusFilters[filter]).length;

        let transactionsThisMonth = transactions.filter(x => x.createDate && DateUtil.isSameJMonth(DateUtil.toDate(x.createDate), new Date()));
        let unPaidFromPast = transactions.filter(x => x.createDate && !DateUtil.isSameJMonth(DateUtil.toDate(x.createDate), new Date())).reduce((s, t) => s + (Number(t.amount) || 0), 0);
        let trafficMonth = Object.keys(traffics).filter(x => DateUtil.isSameJMonth(DateUtil.toDate(x), new Date())).flatMap(x => traffics[x]);
        let usersMap = users.reduce((m, x) => { m[x.email ?? ''] = true; return m; }, {});

        res.json({
            users: {
                Total: users.length,
                ...userCounts
            },
            transactions: {
                unPaidFromPast,
                totalRemainMonth: transactionsThisMonth.reduce((s, t) => s + (Number(t.amount) || 0), 0),
                totalBillMonth: transactionsThisMonth.filter(x => (Number(x.amount) || 0) > 0).reduce((s, t) => s + (Number(t.amount) || 0), 0),
                totalSellMonth: transactionsThisMonth.filter(x => !!x.user && (Number(x.amount) || 0) > 0).reduce((s, t) => s + (Number(t.amount) || 0), 0),
                totalCostMonth: transactionsThisMonth.filter(x => !x.user && (Number(x.amount) || 0) > 0).reduce((s, t) => s + (Number(t.amount) || 0), 0),
                totalRenewMonth: transactionsThisMonth.filter(x => !!x.user && x.remark?.includes('Add') && (Number(x.amount) || 0) > 0).reduce((s, t) => s + (Number(t.amount) || 0), 0),
                totalCreateMonth: transactionsThisMonth.filter(x => !!x.user && x.remark?.includes('Create') && (Number(x.amount) || 0) > 0).reduce((s, t) => s + (Number(t.amount) || 0), 0),
                totalPaidMonth: Math.abs(transactionsThisMonth.filter(x => (Number(x.amount) || 0) < 0).reduce((s, t) => s + (Number(t.amount) || 0), 0)),
            },
            traffics: {
                totalMonth: trafficMonth.filter(x => x.type == 'outbound').reduce((s, t) => s + (t.traffic ?? 0), 0),
                totalSendMonth: trafficMonth.filter(x => x.type == 'outbound' && x.direction == 'uplink').reduce((s, t) => s + t.traffic, 0),
                totalReceiveMonth: trafficMonth.filter(x => x.type == 'outbound' && x.direction == 'downlink').reduce((s, t) => s + t.traffic, 0),
                top10usageUsers: trafficMonth
                .filter(x => x.type == 'user' && usersMap[x.name])
                .reduce((/** @type {{ user: string, traffic: number }[]} */ a, t) => {
                    let user = a.find(x => x.user == t.name);
                    if (user) {
                        user.traffic = (user.traffic ?? 0) + t.traffic;
                    }
                    else {
                        a.push({ user: t.name, traffic: t.traffic })
                    }
                    return a;
                },  [])
                .sort((a, b) => a.traffic > b.traffic ? -1 : 1)
                .slice(0, 10)
            },
            nodes: nodes.filter(x => !x.disabled && x.show_in_home).map(x => {
                x['connectedClients'] = users.filter(u => statusFilters['Connected (1 Hour)'](u) && u['lastConnectNode'] == x.id).length;
                x['monthlyTrafficUsage'] = trafficMonth.filter(t => t.server == x.id && t.type == 'outbound').reduce((s, t) => s + t.traffic, 0);
                return x;
            })
        });
    }
    catch (err) {
        console.log(err);
        res.json({ ok: false, error: err?.message ?? 'Error' });
    }

});

module.exports = { router };