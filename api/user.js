// @ts-check
const { randomUUID } = require('crypto');
const { env } = require('process');
const { addTransaction, getTransactions, saveDb } = require('../lib/db');
const { restartService, getPaths, readConfig, setUserActive, writeConfig, findUser, log, deleteUser, httpAction, readLogFile, DateUtil, addUser, db, addUserToRoute } = require('../lib/util');
const { statusFilters } = require('./common');
const router = require('express').Router();

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
        if (prop == 'flow' || prop == 'id') {
            restartService().catch(console.error);
        }
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

        // Reality
        if (targetInbound.streamSettings?.security == 'reality' && !sourceUser.flow) {
            sourceUser.flow = 'xtls-rprx-vision';
        } else if (sourceUser.flow) {
            // @ts-ignore
            delete sourceUser.flow;
        }

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

    /** @type {import('../types').SystemUser} */
    let user = res.locals.user;
    
    return config?.inbounds?.filter(x => !user || user?.acls?.isAdmin || user?.acls?.allowedInbounds?.includes(x.tag ?? '')).map(x => x[key]);
}));

router.post('/inbounds', httpAction(async (req, res) => {

    let {configPath, accessLogPath} = getPaths();
    let {view, fields = [], flat = false} = req.body;
    let {sortColumn, sortAsc, filter, statusFilter, serverNode, showId, fullTime, precision, page = 1, limit = 20, createdBy} = view;

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');

    let inbounds = config.inbounds ?? [];
    
    /** @type {import('../types').SystemUser} */
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

    /** @type {import('../types').Subscribers} */
    let subscibers = await db('subscribers') ?? {};

    for (let inbound of inbounds) {
        let users = (inbound.settings?.clients ?? []).filter(u => (filters.showPrivate || !u.private) && (filters.showFree || !u.free));
        let total = users.length;
        let totalActive = users.filter(x => !x.deActiveDate).length;
        let maxClientNumber = 0;

        // Fill users fields
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
            user['subscription'] = subscibers[user.email ?? ''] ?? {};
            let clientNumber = Number(user.email?.match(/[0-9]+/));
            if (clientNumber && clientNumber > maxClientNumber)
                maxClientNumber = clientNumber;
        }
        
        let filtered = users
            .filter(u => {
                // Only own users
                if (!user?.acls?.isAdmin && user?.acls?.users?.allUsers != true) {
                    if (u.createdById != user.id) return false;
                }
                return true;
            })
            // Created by filter
            .filter(u => {
                if (!createdBy) return true;
                return u.createdBy == createdBy;
            })
            .filter(u => {
                if (!filter) return true;
                // ID
                if (u.id == filter) return true;
                // Last Connect IP
                if (u['lastConnectIP'] == filter) return true;
                // Last Connect Node
                if (u['lastConnectNode'] == filter) return true;
                // Full Name
                if (u.fullName?.toLowerCase().includes(filter.toLowerCase())) return true;
                // De-active reason
                if (u.deActiveReason?.toLowerCase().includes(filter.toLowerCase())) return true;
                // E-Mail
                if (u.email?.toLowerCase().includes(filter.toLowerCase()) || (filter[0] == '=' && u.email == String(filter).substring(1))) return true;
                return false;
            })
            // Last Connect Node
            .filter(u => !serverNode ? true : serverNode == 'local' ? !u['lastConnectNode'] || u['lastConnectNode'] == 'local' : u['lastConnectNode'] == serverNode)
            // Apply filters
            .filter(u => !Array.isArray(statusFilter) || statusFilter.length == 0 || statusFilter.map(filter => statusFilters[filter]).every(filter => filter(u)))
            // Sort
            .sort((a, b) => {
                if (!sortColumn) return 0;

                let aValue = a[sortColumn];
                let bValue = b[sortColumn];

                try {
                    aValue = aValue ? new Date(aValue) : null;
                    bValue = bValue ? new Date(bValue) : null;
                }
                catch {}

                return aValue == bValue ? 0 : aValue < bValue ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1)
            });
        ;

        if (inbound.settings) {
            inbound.settings.clients = filtered.slice(skip, skip + limit);
            inbound.settings['totalClients'] = total;
            inbound.settings['totalActiveClients'] = totalActive;
            inbound.settings['maxClientNumber'] = maxClientNumber;
            inbound.settings['totalFiltered'] = filtered.length;
            inbound.settings['totalActiveFiltered'] = filtered.filter(x => !x.deActiveDate).length;
            inbound.settings['from'] = skip;
            inbound.settings['to'] = skip + limit;
        }
    }

    // Select fields
    if (Array.isArray(fields) && fields.length > 0) {
        inbounds?.forEach(inbound => {
            if (inbound.settings?.clients) {
                inbound.settings.clients = inbound?.settings?.clients.map(x => {
                    return fields.reduce((obj, field) => {
                        obj[field] = x[field];
                        return obj;
                    }, {});
                });
            }
        })
    }

    if (flat) {
        // @ts-ignore
        inbounds = inbounds?.flatMap(i => i.settings?.clients ?? []).filter((x, index, arr) => arr.findIndex(a => a.email == x.email) == index);
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
        /** @type {import('../types').SystemUser?} */
        let user = res.locals.user;
        if (!email) return res.json({ error: 'Email not entered' });
        if (!tag) return res.json({ error: 'Tag not entered' });
        let {configPath} = getPaths();
        if (quotaLimit) quotaLimit = Number(quotaLimit);
        let result = await addUser(configPath, email, '', tag, {
            fullName, mobile, emailAddress, private, free, quotaLimit,
            createdBy: user?.username,
            createdById: user?.id
        });
        if (!free) {
            await addTransaction({
                user: email,
                amount: Number(user?.pricing?.newUserCost ?? env.CREATE_COST ?? 50000),
                remark: `Create user ${email}`,
                createdBy: user?.username,
                createdById: user?.id,
                createdFor: user?.createBillsFor ?? user?.username
            });
        }
        res.json({ ok: true, id: result.id });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
    }
});

router.get('/user/nodes', httpAction(async (req, res) => {

    /** @type {import('../types').SystemUser} */
    const admin = res.locals.user;

    /** @type {import('../types').ServerNode[]} */
    const nodes = await db('server-nodes') ?? [];

    /** @type {string} */
    const userId = String(req.query.userId);

    /** @type {string} */
    const email = String(req.query.email);

    if (!userId && !email)
        throw Error(`User is invalid`);

    const fetch = (await import('node-fetch')).default;

    /** @type {import('../types').V2RayConfigInboundClient[]} */
    const clients = [];

    for (let node of nodes.filter(x => !x.disabled && x.show_in_other_nodes)) {       
            try {
            let result = await fetch(node.address + '/inbounds', {
                body: JSON.stringify({
                    private: true,
                    view: {
                        filter: email ? '=' + email : userId,
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
                    'Content-Type': 'application/json',
                    'X-User': Buffer.from(JSON.stringify({ ...admin, password: undefined })).toString('base64')
                }
            });

            /** @type {import('../types').V2RayConfigInbound[]} */
            // @ts-ignore
            let inbounds = await result.json();
            if (Array.isArray(inbounds)) {
                clients.push(...inbounds?.flatMap(x => x?.settings?.clients?.map(u => {
                    return {...u, serverNode: node.name, inboundTag: x.tag }
                }) ?? []) ?? []);
            }
        } catch (err) {
            console.error(`Error on node : ${node.name}`, err);
        }
    }

    res.json(clients);
}));


router.post('/add_days', async (req, res) => {
    try {
        let {email, days, tag} = req.body;
        /** @type {import('../types').SystemUser?} */
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
                createdById: systemUser?.id,
                createdFor: systemUser?.createBillsFor ?? systemUser?.username
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

router.post('/user/cancel', httpAction(async (req, res) => {
    const {user, deActiveReason, transactionRemark} = req.body;
    if (!user)
        throw Error(`Invalid request`);

    /** @type {import('../types').SystemUser} */
    const admin = res.locals.user;

    if (!admin?.acls?.isAdmin && !admin?.acls?.users?.cancel) {
        throw Error('Access denied');
    }

    const {configPath} = getPaths();
    const config = readConfig(configPath);
    const transactions = await getTransactions();

    const userTransactions = transactions.filter(x => x.user == user);
    const inbounds = config?.inbounds?.flatMap(x => x.settings?.clients ?? []).filter(x => x.email == user);

    inbounds?.forEach(x => {
        x.deActiveDate = new Date().toString();
        x.deActiveReason = deActiveReason;
    })

    if (userTransactions?.length > 0) {
        let lastTransaction = userTransactions[userTransactions.length-1];
        lastTransaction.amount = 0;
        lastTransaction.remark = transactionRemark;
    }

    addUserToRoute(config, user, 'baduser');
    writeConfig(configPath, config);
    await saveDb();

    return { ok: true };
}));

module.exports = { router };