// @ts-check
const express = require('express');
const { env } = require('process');
const { getPaths, readConfig, createLogger, readLogFile } = require('./util');

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
    next();
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

app.post('/restart', async (req, res) => {
    const {spawn} = require('child_process');
    let result = spawn('servicectl restart v2ray');
    let output = '';
    result.stdout.on('data', buffer => {
        output += buffer.toString('utf-8');
    });
    result.once('exit', () => {
        res.end(output);
    });
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

app.listen(env.WEB_PORT ?? 8080, () =>  showInfo(`Server started on port ${env.WEB_PORT ?? 8080}`));