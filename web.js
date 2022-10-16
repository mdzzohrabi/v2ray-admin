// @ts-check

// Load envrionment configuration
require('dotenv').config();

const express = require('express');
const { env } = require('process');
const basicAuth = require('express-basic-auth');
const { getPaths, readConfig, createLogger } = require('./util');
const nReadLines = require('n-readlines');

let app = express();
let {showInfo} = createLogger();

// app.use(basicAuth({
//     users: {
//         [env.WEB_USERNAME ?? 'admin']: env.WEB_PASSWORD ?? 'admin'
//     }
// }));

let users = {
    [env.WEB_USERNAME ?? 'admin']: env.WEB_PASSWORD ?? 'admin'
};

app.use((req, res, next) => {

  // parse login and password from headers
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  showInfo(`Login ${login} with password ${password}`);

  // Verify login and password are set and correct
  if (login && password && users[login] == password) {
    // Access granted...
    return next()
  }

  // Access denied...
  res.set('WWW-Authenticate', 'Basic realm="401"') // change this
  res.status(401).send('Authentication required.') // custom message
});

app.get('/users', (req, res) => {

    let {configPath, accessLogPath} = getPaths();

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return res.status(500).end('No inbounds defined in configuration');

    let inbounds = config.inbounds ?? [];

    // 2022/10/14 01:57:05 171.22.27.137:52678 accepted tcp:app-measurement.com:443 [blocked] email: user18
    let file = new nReadLines(accessLogPath);

    /** @type {Buffer | boolean} */
    let buffer;

    let usages = {};

    while (buffer = file.next()) {
        let [date, time, clientAddress, status, destination, route, email, user] = buffer.toString('utf-8').split(' ');
        if (!user) continue;
        user = user.trim();
        let usage = usages[user] = usages[user] ?? {};
        let dateTime = new Date(date + ' ' + time);
        if (!usage.firstConnect || dateTime < usage.firstConnect)
            usage.firstConnect = dateTime;

        if (!usage.lastConnect || dateTime > usage.lastConnect)
            usage.lastConnect = dateTime;
    }

    let response = '<html><head><title>Users</title></head><body>';


    for (let inbound of inbounds) {
        response += `<h1>Users of protocol "${inbound.protocol}"${inbound.tag ? `, Tag: ${inbound.tag}` : ''}</h1>`;
        response += `<table>
            <tr>
                <th>ID</th>
                <th>User</th>
                <th>First Connect</th>
                <th>Last Connect</th>
            </tr>
        `;
        let users = inbound.settings?.clients ?? [];
        for (let user of users) {
            let usage = usages[user.email];
            user['firstConnect'] = usage?.firstConnect;
            user['lastConnect'] = usage?.lastConnect;
            response += `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user['firstConnect']}</td>
                <td>${user['lastConnect']}</td>
            </tr>`
        }
        response += '</table></body>';
    }

    res.end(response);


});

app.listen(env.WEB_PORT ?? 8080, () =>  showInfo(`Server started on port ${env.WEB_PORT ?? 8080}`));