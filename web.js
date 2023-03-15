// @ts-check
const express = require('express');
const { env } = require('process');
const { createServer } = require('http');
const { createLogger } = require('./lib/util');
const { router: clientApi } = require('./api/client');
const { router: remoteApi } = require('./api/remote-api');
const { router: authentication } = require('./api/authentication');
const { router: api } = require('./api/api');
const { router: nodeApi } = require('./api/node-api');
const { router: systemApi } = require('./api/system-api');
const { createSocketServer } = require('./api/socket');

let {showInfo} = createLogger();

// Express Handler
let app = express();

// HTTP server
let server = createServer(app);

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    if (req.method == 'OPTIONS') return res.end();
    next();
});

// Express JSON Limit
app.use(express.json({
    limit: '5mb'
}));

app.use('/client', clientApi);
app.use(authentication);
app.use(systemApi);
app.use(remoteApi);
app.use(nodeApi);
app.use(api);

createSocketServer(server);

server.listen(env.WEB_PORT ?? 8080, () =>  showInfo(`Server started on port ${env.WEB_PORT ?? 8080}`));