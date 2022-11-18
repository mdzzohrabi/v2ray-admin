// @ts-check
const { randomUUID } = require('crypto');
const express = require('express');
const { env } = require('process');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { getPaths, readConfig, createLogger, readLogFile, getUserConfig, addUser, restartService, findUser, setUserActive, writeConfig, deleteUser, log, readLines, watchFile, cache } = require('./util');
const { getTransactions, addTransaction, saveDb, readDb } = require('./db');

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
    res.json(config);
});

app.put('/config', async (req, res) => {
    let {configPath} = getPaths();
    let config = readConfig(configPath);
    let {writeFile, copyFile} = require('fs/promises');
    await copyFile(configPath, configPath + '.backup_' + Date.now());
    await writeFile(configPath, JSON.stringify({ ...config, ...req.body }));
    res.json({ ok: true });
});

app.get('/usages', async (req, res) => {
    let {accessLogPath} = getPaths();
    let usages = await readLogFile(accessLogPath);
    res.json(usages);
});

app.post('/client_config', (req, res) => {
    /** @type {V2RayConfigInboundClient} */
    let user = req.body;
    let protocol = req.query.protocol?.toString();

    if (!user || !user.id || !user.email || !protocol) return res.status(500).json({ error: 'Invalid request' });

    let {strClientConfig} = getUserConfig(user, protocol);

    res.json({ config: strClientConfig });
});

app.post('/restart', async (req, res) => {
    restartService().then(result => res.end(result));
});

app.post('/active', async (req, res) => {
    try {
        let {email, protocol, active} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = setUserActive(config, email, active);
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
        let {email, protocol, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email);
        if (!user) throw Error('User not found');
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
        let {email, protocol, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email);
        if (!user) throw Error('User not found');
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
        let {email, protocol, prop, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email);
        if (!user) throw Error('User not found');
        log(`Change user "${email}" property "${prop}" from "${user[prop]}" to "${value}"`);
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
        let {email, protocol, value} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email);
        if (!user) throw Error('User not found');
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
        let {email, protocol} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email);
        if (!user) throw Error('User not found');
        log(`Generate new id for user ${user.email} (Old ID: ${user.id})`)
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


app.get('/inbounds', async (req, res) => {

    let {configPath, accessLogPath} = getPaths();

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');

    let inbounds = config.inbounds ?? [];

    let usages = await readLogFile(accessLogPath);

    for (let inbound of inbounds) {
        let users = inbound.settings?.clients ?? [];
        for (let user of users) {
            let usage = user.email ? usages[user.email] : {};
            user.firstConnect = user.firstConnect ?? usage?.firstConnect;
            user['lastConnect'] = usage?.lastConnect;
            user.expireDays = user.expireDays || Number(env.V2RAY_EXPIRE_DAYS) || 30;
            user.maxConnections = user.maxConnections || Number(env.V2RAY_MAX_CONNECTIONS) || 3;
            user.billingStartDate = user.billingStartDate ?? user.firstConnect;
        }
    }

    res.json(inbounds);
});

app.post('/user', async (req, res) => {
    try {
        let {email, protocol, fullName, mobile, emailAddress, private, free} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        if (!protocol) return res.json({ error: 'Protocol not entered' });
        let {configPath} = getPaths();
        let result = await addUser(configPath, email, protocol, null, {
            fullName, mobile, emailAddress, private, free
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
        res.json({ transaction: result });
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

app.get('/daily_usages', async (req, res) => {
    try {
        let email = String(req.query.email);
        let dailyUsage = await cache('daily-usage') ?? {};
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

app.post('/add_days', async (req, res) => {
    try {
        let {email, days} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        let {configPath} = getPaths();
        let config = readConfig(configPath);
        let user = findUser(config, email);

        if (!user) throw Error(`User not found`);

        let isDeActive = !!user?.deActiveDate;
        let isExpired = user?.deActiveReason?.includes('Expired');
        let needRestart = false;
        let cost = (days / 30) * Number(env.MONTH_COST ?? 50000);
        
        if (isDeActive && isExpired) {
            // Active user
            setUserActive(config, email, true);
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