// @ts-check
const { randomUUID } = require('crypto');
const { env } = require('process');
const { addTransaction, getTransactions, readDb, saveDb } = require('../lib/db');
const { getPaths, readConfig, applyChanges, writeConfig, readLogFile, getUserConfig, restartService, setUserActive, findUser, log, deleteUser, DateUtil, addUser, db, readLogLinesByOffset, createLogger, ping, httpAction } = require('../lib/util');

let {showInfo, showError} = createLogger();

const router = require('express').Router();


/** @type {{ [name: string]: (user: V2RayConfigInboundClient) => boolean }} */
const statusFilters = {
    'Active': u => !u.deActiveDate,
    'De-Active': u => !!u.deActiveDate,
    'Expired': u => (u.deActiveReason?.includes('Expired') ?? false),
    'Private': u => !!u.private,
    'Non-Private': u => !u.private,
    'Free': u => !!u.free,
    'Non-Free': u => !u.free,
    'Without FullName': u => !u.fullName,
    'With FullName': u => !!u.fullName,
    'Without Mobile': u => !u.mobile,
    'With Mobile': u => !!u.mobile,
    'Not Connected (1 Hour)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60),
    'Not Connected (10 Hours)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 10),
    'Not Connected (1 Day)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 24),
    'Not Connected (1 Month)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 24 * 30),
    'Connected (1 Minutes)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 1),
    'Connected (2 Minutes)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 2),
    'Connected (5 Minutes)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 5),
    'Connected (1 Hour)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60),
    'Connected (10 Hours)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 10),
    'Connected (1 Day)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 24),
    'Connected (1 Month)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 24 * 30),
    'Recently Created (1 Hour)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60),
    'Recently Created (10 Hours)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 10),
    'Recently Created (1 Day)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 24),
    'Recently Created (1 Month)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 24 * 30),
    'Expiring (6 Hours)': u => !u.deActiveDate && !!u.billingStartDate &&  ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 6),
    'Expiring (24 Hours)': u => !u.deActiveDate && !!u.billingStartDate && ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24),
    'Expiring (3 Days)': u => !u.deActiveDate && !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 3),
    'Expiring (1 Week)': u => !u.deActiveDate && !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 7),
    'Re-activated from Expire (1 Week)': u => !!u.billingStartDate && u.billingStartDate != u.firstConnect && (Date.now() - new Date(u.billingStartDate).getTime() <= 1000 * 60 * 60 * 24 * 7),
    'Unlimit Bandwidth': u => !u['quotaLimit'] || u['quotaLimit'] == 0,
    'Limited Bandwidth': u => (u['quotaLimit'] ?? 0) > 0,
};

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

router.get('/usages', async (req, res) => {
    let {accessLogPath} = getPaths();
    let usages = await readLogFile(accessLogPath);
    res.json(usages);
});

router.post('/client_config', async (req, res) => {
    /** @type {V2RayConfigInboundClient} */
    let user = req.body;
    let tag = req.query.tag?.toString();

    if (!user || !user.id || !user.email || !tag) return res.status(500).json({ error: 'Invalid request' });

    let {strClientConfig} = await getUserConfig(user, tag);

    res.json({ config: strClientConfig });
});

router.post('/restart', async (req, res) => {
    restartService().then(result => res.json({ result }));
});

router.post('/active', async (req, res) => {
    try {
        let {email, tag, active} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        setUserActive(config, tag, email, active);
        await writeConfig(configPath, config);
        res.json({ ok: true });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/max_connections', async (req, res) => {
    try {
        let {email, tag, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);
        if (!user) throw Error('User not found');
        log(`User ${email} : Change max connection from ${user.maxConnections} to ${value}`);
        user.maxConnections = Number(value);
        await writeConfig(configPath, config);
        res.json({ ok: true });
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/expire_days', async (req, res) => {
    try {
        let {email, tag, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);
        if (!user) throw Error('User not found');
        log(`User ${email} : Change expire days from ${user.expireDays} to ${value}`);
        user.expireDays = Number(value);
        await writeConfig(configPath, config);
        res.json({ ok: true });
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/set_info', async (req, res) => {
    try {
        let {email, tag, prop, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);
        if (!user) throw Error('User not found');
        if (prop == 'quotaLimit' && value) value = Number(value);
        log(`User ${email} : Change property "${prop}" from "${user[prop]}" to "${value}"`);
        user[prop] = value;
        await writeConfig(configPath, config);
        res.json({ ok: true });
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});


router.post('/change_username', async (req, res) => {
    try {
        let {email, tag, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);
        if (!user) throw Error('User not found');
        log(`Change username from ${user.email} to ${value}`);
        user.email = String(value);
        await writeConfig(configPath, config);
        res.json({ ok: true });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/regenerate_id', async (req, res) => {
    try {
        let {email, tag} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);
        if (!user) throw Error('User not found');
        log(`User ${email} : Generate new id (Old ID: ${user.id})`)
        user.id = randomUUID();
        await writeConfig(configPath, config);
        res.json({ ok: true });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/remove_user', async (req, res) => {
    try {
        let {email, protocol, tag} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let user = await deleteUser(configPath, email, protocol, tag);
        res.json({ ok: true });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/change_user_inbound', async (req, res) => {
    try {
        let {email, fromTag, toTag} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        if (!toTag || !fromTag) return res.json({ error: 'Invalid request' });

        let {configPath} = getPaths();
        let config = readConfig(configPath);

        let sourceInbound = config.inbounds?.find(x => x.tag == fromTag);
        if (!sourceInbound) return res.json({ error: 'Source inbound not found' });
        
        let targetInbound = config.inbounds?.find(x => x.tag == toTag);
        if (!targetInbound) return res.json({ error: 'Target inbound not found' });
        
        let sourceUser = sourceInbound.settings?.clients?.find(x => x.email == email);
        if (!sourceUser) return res.json({ error: 'User not found' });
        let sourceUserIndex = sourceInbound?.settings?.clients?.indexOf(sourceUser) ?? -1;

        if (!!targetInbound.settings?.clients?.find(x => x.email == email))
            return res.json({ error: 'User already exists in target inbound' });

        if (!targetInbound.settings)
            targetInbound.settings = {};

        if (!targetInbound.settings?.clients)
            targetInbound.settings.clients = [];

        // Add to target
        targetInbound.settings.clients.push(sourceUser);

        // Remove from source
        sourceInbound.settings?.clients?.splice(sourceUserIndex, 1);

        log(`User ${email} : Change inbound from ${fromTag} to ${toTag}`);

        // Save
        await writeConfig(configPath, config);
        res.json({ ok: true });
        restartService().catch(console.error);
    }
    catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.post('/copy_user', async (req, res) => {
    try {
        let {email, newEmail, fromTag, toTag} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        if (!toTag || !fromTag) return res.json({ error: 'Invalid request' });

        let {configPath} = getPaths();
        let config = readConfig(configPath);

        let sourceInbound = config.inbounds?.find(x => x.tag == fromTag);
        if (!sourceInbound) return res.json({ error: 'Source inbound not found' });
        
        let targetInbound = config.inbounds?.find(x => x.tag == toTag);
        if (!targetInbound) return res.json({ error: 'Target inbound not found' });
        
        let sourceUser = sourceInbound.settings?.clients?.find(x => x.email == email);
        if (!sourceUser) return res.json({ error: 'User not found' });
        let sourceUserIndex = sourceInbound?.settings?.clients?.indexOf(sourceUser) ?? -1;

        if (!!targetInbound.settings?.clients?.find(x => x.email == email))
            return res.json({ error: 'User already exists in target inbound' });

        if (!targetInbound.settings)
            targetInbound.settings = {};

        if (!targetInbound.settings?.clients)
            targetInbound.settings.clients = [];

        // Add to target
        targetInbound.settings.clients.push({ ...sourceUser, email: newEmail ?? sourceUser.email });

        log(`User ${email} : Copy to inbound from ${fromTag} to ${toTag} with username ${newEmail ?? email}`);

        // Save
        await writeConfig(configPath, config);
        res.json({ ok: true });
        restartService().catch(console.error);
    }
    catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.get('/status_filters', (req, res) => {
    res.json(Object.keys(statusFilters))
});

router.get('/inbounds/:key', httpAction(async (req, res) => {
    const {configPath} = getPaths();
    const config = readConfig(configPath);
    const {key} = req.params;

    /** @type {SystemUser} */
    let user = res.locals.user;
    
    return config?.inbounds?.filter(x => !user || user?.acls?.isAdmin || user?.acls?.allowedInbounds?.includes(x.tag ?? '')).map(x => x[key]);
}));

router.post('/inbounds', httpAction(async (req, res) => {

    let {configPath, accessLogPath} = getPaths();
    let {view, private} = req.body;
    let {sortColumn, sortAsc, filter, statusFilter, serverNode, showId, fullTime, precision, page = 1, limit = 20} = view;

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');

    let inbounds = config.inbounds ?? [];
    
    /** @type {SystemUser} */
    let user = res.locals.user;
    

    // Filters
    let filters = {
        showPrivate: !user || user?.acls?.isAdmin || user?.acls?.users?.privateUsers,
        showFree: !user || user?.acls?.isAdmin || user?.acls?.users?.freeUsers
    }

    // Filter inbounds
    if (user) {
        let allowedInbounds = user.acls?.allowedInbounds ?? [];
        if (!user.acls?.isAdmin)
            inbounds = inbounds.filter(x => allowedInbounds.includes(x.tag ?? ''));
    }

    let usages = await readLogFile(accessLogPath);

    limit = Number(limit);
    page = Number(page);

    let skip = (page * limit) - limit;

    for (let inbound of inbounds) {
        let users = (inbound.settings?.clients ?? []).filter(u => (filters.showPrivate || !u.private) && (filters.showFree || !u.free));
        let total = users.length;
        let maxClientNumber = 0;
        for (let user of users) {
            let usage = user.email ? usages[user.email] : {};
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
            let clientNumber = Number(user.email?.match(/[0-9]+/));
            if (clientNumber && clientNumber > maxClientNumber)
                maxClientNumber = clientNumber;
        }
        
        let filtered = users
            .filter(u => !filter || (u.id == filter || u['lastConnectIP'] == filter || u['lastConnectNode'] == filter || u.fullName?.toLowerCase().includes(filter.toLowerCase()) || u.email?.toLowerCase().includes(filter.toLowerCase())))
            .filter(u => !serverNode ? true : serverNode == 'local' ? !u['lastConnectNode'] || u['lastConnectNode'] == 'local' : u['lastConnectNode'] == serverNode)
            .filter(u => statusFilter.length == 0 || statusFilter.map(filter => statusFilters[filter]).every(filter => filter(u)))
            .sort((a, b) => !sortColumn ? 0 : a[sortColumn] == b[sortColumn] ? 0 : a[sortColumn] < b[sortColumn] ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1))
        ;

        if (inbound.settings) {
            inbound.settings.clients = filtered.slice(skip, skip + limit);
            inbound.settings['totalClients'] = total;
            inbound.settings['maxClientNumber'] = maxClientNumber;
            inbound.settings['totalFiltered'] = filtered.length;
            inbound.settings['from'] = skip;
            inbound.settings['to'] = skip + limit;
        }
    }

    res.json(inbounds);
}));

router.get('/inbounds_clients', async (req, res) => {
    let {configPath} = getPaths();
    let {showAll} = req.query;
    let config = readConfig(configPath);
    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');
    let inbounds = config.inbounds ?? [];
    let clients = inbounds.flatMap(x => x.settings?.clients ?? [])?.filter(x => showAll == 'true' || !x.private).map(x => x.email);
    res.json(clients);
});

router.post('/user', async (req, res) => {
    try {
        let {email, tag, fullName, mobile, emailAddress, private, free, quotaLimit} = req.body;
        /** @type {SystemUser?} */
        let user = res.locals.user;
        if (!email) return res.json({ error: 'Email not entered' });
        if (!tag) return res.json({ error: 'Tag not entered' });
        let {configPath} = getPaths();
        if (quotaLimit) quotaLimit = Number(quotaLimit);
        let result = await addUser(configPath, email, 'vmess', tag, {
            fullName, mobile, emailAddress, private, free, quotaLimit
        });
        if (!free) {
            await addTransaction({
                user: email,
                amount: Number(user?.pricing?.newUserCost ?? env.CREATE_COST ?? 50000),
                remark: `Create user ${email}`,
                createdBy: user?.username,
                createdById: user?.id
            });
        }
        res.json({ ok: true, id: result.id });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
    }
});

router.get('/user/nodes', httpAction(async (req, res) => {
    /** @type {ServerNode[]} */
    const nodes = await db('server-nodes') ?? [];

    /** @type {string} */
    const userId = String(req.query.userId);

    if (!userId)
        throw Error(`User id is invalid`);

    const fetch = (await import('node-fetch')).default;

    /** @type {V2RayConfigInboundClient[]} */
    const clients = [];

    for (let node of nodes.filter(x => !x.disabled)) {       
            try {
            let result = await fetch(node.address + '/inbounds', {
                body: JSON.stringify({
                    private: true,
                    view: {
                        filter: userId,
                        limit: 10,
                        inbounds: [],
                        statusFilter: [],
                        showId: true,
                        sortAsc: true 
                    }
                }),
                method: 'post',
                headers: {
                    Authorization: 'Bearer ' + Buffer.from(node.apiKey).toString('base64'),
                    'Content-Type': 'application/json'
                }
            });

            /** @type {V2RayConfigInbound[]} */
            // @ts-ignore
            let inbounds = await result.json();
            if (Array.isArray(inbounds)) {
                clients.push(...inbounds?.flatMap(x => x?.settings?.clients ?? [])?.map(x => {
                    return {...x, serverNode: node.name }
                }) ?? []);
            }
        } catch (err) {
            console.error(`Error on node : ${node.name}`, err);
        }
    }

    res.json(clients);
}));

router.get('/transactions', async (req, res) => {
    try {
        res.json(await getTransactions());
    }
    catch (err) {
        res.json({ error: err.message });
    }
});


router.post('/transactions', async (req, res) => {
    /** @type {SystemUser?} */
    let user = res.locals.user;
    try {
        let result = await addTransaction({ ...req.body, createdBy: user?.username, createdById: user?.id });
        res.json({ transaction: result });
    }
    catch (err) {
        res.json({ error: err.message });
    }
});

router.post('/remove_transaction', async (req, res) => {
    try {
        let {id} = req.body;
        let db = await readDb();
        db.transactions = db.transactions?.filter(x => x.id != id) ?? [];
        saveDb();
        res.json({ ok: true });
    }
    catch (err) {
        res.json({ error: err.message });
    }
});

router.post('/edit_transaction', async (req, res) => {
    try {
        let {id, field, value} = req.body;
        let db = await readDb();
        let transaction = db.transactions?.find(x => x.id == id);
        if (!transaction) throw Error(`Transaction not found`);
        transaction[field] = value;
        saveDb();
        res.json({ ok: true });
    }
    catch (err) {
        res.json({ error: err.message });
    }
});

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

router.post('/add_days', async (req, res) => {
    try {
        let {email, days, tag} = req.body;
        /** @type {SystemUser?} */
        let systemUser = res.locals.user;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);

        if (!user) throw Error(`User not found`);

        let isDeActive = !!user?.deActiveDate;
        let isExpired = user?.deActiveReason?.includes('Expired');
        let needRestart = false;
        let cost = (days / 30) * Number(systemUser?.pricing?.renewUserCost ?? env.MONTH_COST ?? 50000);
        
        if (isDeActive && isExpired) {
            // Active user
            setUserActive(config, tag, email, true);
            needRestart = true;
            user.expireDays = days;
        }
        else {
            user.expireDays = (user.expireDays ?? 30) + days;
        }

        if (!user?.free) {
            await addTransaction({
                amount: cost,
                user: email,
                remark: `Add ${days} days (${days/30} months)`,
                createdBy: systemUser?.username,
                createdById: systemUser?.id
            });
        }

        await writeConfig(configPath, config);

        res.json({ ok: true });
        if (needRestart)
            restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
        console.error(err);
    }
});

router.get('/nodes', httpAction(async (req, res) => {
    /** @type {ServerNode[]} */
    let nodes = await db('server-nodes') ?? [];
    let {all} = req.query;

    return nodes.filter(x => !all ? !x.disabled : true);
}));

router.post('/nodes', async (req, res) => {
    try {
        /** @type {Partial<ServerNode>} */
        let { address, type = 'client', sync = false, apiKey, name, disabled } = req.body;

        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        if (nodes.find(x => x.address == address)) {
            res.json({ ok: false, error: 'This Node already exists' });
            return;
        }

        nodes.push({
            name,
            id: randomUUID(),
            apiKey: type == 'client' ? randomUUID() : apiKey ?? '',
            address,
            type,
            sync,
            disabled
        });

        await db('server-nodes', nodes);

        res.json({ ok: true, message: 'Server node added successful' });
    }
    catch (err) {
        res.json({ error: err.message });
        showError(err);
    }
});

router.put('/nodes', async (req, res) => {
    try {
        /** @type {Partial<ServerNode>} */
        let { id, type, address, sync, name, apiKey, disabled } = req.body;

        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        let node = nodes.find(x => x.id == id);

        if (!node) {
            res.json({ ok: false, error: 'Node not found' });
            return;
        }

        node.name = name;
        if (apiKey && type == 'server')
            node.apiKey = apiKey;
        node.address = address;
        node.type = type;
        node.sync = sync;
        node.disabled = disabled;

        await db('server-nodes', nodes);

        res.json({ ok: true, message: 'Node changed successful' });
    }
    catch (err) {
        res.json({ error: err.message });
        showError(err);
    }
});

router.delete('/nodes', async (req, res) => {
    try {
        let { id } = req.body;
        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        nodes = nodes.filter(x => x.id != id);

        await db('server-nodes', nodes);

        res.json({ ok: true, message: 'Node removed successful' });
    }
    catch (err) {
        res.json({ error: err.message });
        showError(err);
    }
});

router.get('/summary', async (req, res) => {
    try {
        let {showAll} = req.query;

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
            ?.flatMap(x => x.settings?.clients ?? [])
            .filter(x => showAll == 'true' || !x.private)
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
            nodes: nodes.filter(x => !x.disabled).map(x => {
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


router.get('/ping-nodes', async (req, res) => {
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