// @ts-check
const express = require('express');
const { env } = require('process');
const { getPaths, readConfig, createLogger, readLogFile, getUserConfig, addUser, restartService, findUser, setUserActive, writeConfig, deleteUser } = require('./util');

let app = express();
let {showInfo} = createLogger();

// let users = {
//     [env.WEB_USERNAME ?? 'admin']: env.WEB_PASSWORD ?? 'admin'
// };

// app.use((req, res, next) => {

//   // parse login and password from headers
//   const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
//   const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

//   showInfo(`Login ${login} with password ${password}`);

//   // Verify login and password are set and correct
//   if (login && password && users[login] == password) {
//     // Access granted...
//     return next()
//   }

//   // Access denied...
//   res.set('WWW-Authenticate', 'Basic realm="401"') // change this
//   res.status(401).send('Authentication required.') // custom message
// });
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
        setUserActive(config, email, active);
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
        restartService().catch(console.error);
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
        user.email = (value);
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
        await deleteUser(configPath, email, protocol, tag);
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
            user['firstConnect'] = usage?.firstConnect;
            user['lastConnect'] = usage?.lastConnect;
        }
    }

    res.json(inbounds);
});

app.post('/user', async (req, res) => {
    try {
        let {email, protocol} = req.body;
        if (!email) return res.json({ error: 'Email not entered' });
        if (!protocol) return res.json({ error: 'Protocol not entered' });
        let {configPath} = getPaths();
        let result = await addUser(configPath, email, protocol);
        res.json({ ok: true, id: result.id });
        restartService().catch(console.error);
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.listen(env.WEB_PORT ?? 8080, () =>  showInfo(`Server started on port ${env.WEB_PORT ?? 8080}`));