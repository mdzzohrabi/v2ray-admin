// @ts-check
const { randomUUID } = require('crypto');
const express = require('express');
const { env } = require('process');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { getPaths, readConfig, createLogger, readLogFile, getUserConfig, addUser, restartService, findUser, setUserActive, writeConfig, deleteUser, log, readLines, watchFile, cache, applyChanges, readLogLines, readLogLinesByOffset, DateUtil, db } = require('./lib/util');
const { getTransactions, addTransaction, saveDb, readDb } = require('./lib/db');
const { encrypt } = require('crypto-js/aes');

const encryptData = (data) => {
    return data;
    return { encoded: encrypt(JSON.stringify(data), 'masoud').toString() }
}

let {showInfo} = createLogger();
let app = express();
let server = createServer(app);
let socket = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: []
      }
});

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

app.get('/account_deactive', (req, res) => {
    res.end('Account disabled');
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    if (req.method == 'OPTIONS') return res.end();
    next();
});

app.use(express.json());

app.use((req, res, next) => {
    if (!req.headers.authorization)
        return res.status(401).send('Authentication required');
    let token = Buffer.from(req.headers.authorization?.split(' ')[1] ?? '', 'base64').toString('utf-8');
    if (token == env.WEB_TOKEN)
        next();
    else res.status(401).send('Authentication failed');
});

app.get('/config', async (req, res) => {
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    res.json(encryptData(config));
});

app.post('/config', async (req, res) => {
    let {changes} = req.body;
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    let newConfig = applyChanges(config, changes);
    await writeConfig(configPath, newConfig);
    res.json({ ok: true });
});

app.get('/usages', async (req, res) => {
    let {accessLogPath} = getPaths();
    let usages = await readLogFile(accessLogPath);
    res.json(encryptData(usages));
});

app.post('/client_config', async (req, res) => {
    /** @type {V2RayConfigInboundClient} */
    let user = req.body;
    let tag = req.query.tag?.toString();

    if (!user || !user.id || !user.email || !tag) return res.status(500).json({ error: 'Invalid request' });

    let {strClientConfig} = await getUserConfig(user, tag);

    res.json({ config: strClientConfig });
});

app.post('/restart', async (req, res) => {
    restartService().then(result => res.json({ result }));
});

app.post('/active', async (req, res) => {
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

app.post('/max_connections', async (req, res) => {
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

app.post('/expire_days', async (req, res) => {
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

app.post('/set_info', async (req, res) => {
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


app.post('/change_username', async (req, res) => {
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

app.post('/regenerate_id', async (req, res) => {
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

app.post('/remove_user', async (req, res) => {
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

app.post('/change_user_inbound', async (req, res) => {
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

app.post('/copy_user', async (req, res) => {
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

app.get('/status_filters', (req, res) => {
    res.json(Object.keys(statusFilters))
});

app.post('/inbounds', async (req, res) => {

    let {configPath, accessLogPath} = getPaths();
    let {view, private} = req.body;
    let {sortColumn, sortAsc, filter, statusFilter, showId, fullTime, precision, page = 1, limit = 20} = view;

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');

    let inbounds = config.inbounds ?? [];

    let usages = await readLogFile(accessLogPath);

    limit = Number(limit);
    page = Number(page);

    let skip = (page * limit) - limit;

    for (let inbound of inbounds) {
        let users = (inbound.settings?.clients ?? []).filter(u => private || !u.private);
        let total = users.length;
        let maxClientNumber = 0;
        for (let user of users) {
            let usage = user.email ? usages[user.email] : {};
            user.firstConnect = user.firstConnect ?? usage?.firstConnect;
            user['lastConnect'] = usage?.lastConnect;
            user['lastConnectIP'] = usage?.lastConnectIP;
            user['quotaUsage'] = usage?.quotaUsage;
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
            .filter(u => !filter || (u.id == filter || u['lastConnectIP'] == filter || u.fullName?.toLowerCase().includes(filter.toLowerCase()) || u.email?.toLowerCase().includes(filter.toLowerCase())))
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

    res.json(encryptData(inbounds));
});

app.get('/inbounds_clients', async (req, res) => {
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');
    let inbounds = config.inbounds ?? [];
    let clients = inbounds.flatMap(x => x.settings?.clients ?? [])?.map(x => x.email);
    res.json(encryptData(clients));
});

app.post('/user', async (req, res) => {
    try {
        let {email, tag, fullName, mobile, emailAddress, private, free, quotaLimit} = req.body;
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
                amount: Number(env.CREATE_COST ?? 50000),
                remark: `Create user ${email}`
            });
        }
        res.json({ ok: true, id: result.id });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.get('/transactions', async (req, res) => {
    try {
        res.json(await getTransactions());
    }
    catch (err) {
        res.json({ error: err.message });
    }
});


app.post('/transactions', async (req, res) => {
    try {
        let result = await addTransaction(req.body);
        res.json(encryptData({ transaction: result }));
    }
    catch (err) {
        res.json({ error: err.message });
    }
});

app.post('/remove_transaction', async (req, res) => {
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

app.post('/edit_transaction', async (req, res) => {
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

app.get('/traffic', async (req, res) => {
    res.json(await db('traffic-usages'))
});

app.get('/daily_usages', async (req, res) => {
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


app.get('/daily_usage_logs', async (req, res) => {
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

app.post('/add_days', async (req, res) => {
    try {
        let {email, days, tag} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email, tag);

        if (!user) throw Error(`User not found`);

        let isDeActive = !!user?.deActiveDate;
        let isExpired = user?.deActiveReason?.includes('Expired');
        let needRestart = false;
        let cost = (days / 30) * Number(env.MONTH_COST ?? 50000);
        
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
                remark: `Add ${days} days (${days/30} months)`
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

let logWatch = socket.of('/logs');

logWatch.on('connection', async client => {
    let abort = new AbortController();
    let {accessLogPath} = getPaths();
    let filter = '';

    client.on('filter', clientFilter => {
        filter = clientFilter;
    })

    client.on('disconnect', () => {
        console.log('Disconnect', new Date());
        try {
            if (!abort.signal.aborted)
                abort?.abort();
        } catch {}
    });

    let watcher = watchFile(accessLogPath, abort);

    console.log('Watch', new Date());

    try {
        for await (const line of watcher) {
            if (filter && line?.includes(filter))
                client.emit('log', line);
        }
    } catch (err) {
    }
});

server.listen(env.WEB_PORT ?? 8080, () =>  showInfo(`Server started on port ${env.WEB_PORT ?? 8080}`));