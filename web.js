// @ts-check
const express = require('express');
const { env } = require('process');
const { createServer } = require('http');
const { createLogger } = require('./lib/util');
const { createSocketServer } = require('./api/socket');

// Routers
const routers = [
    require('./api/client').router,
    require('./api/monitor').router,
    require('./api/authentication').router,
    require('./api/system-api').router,
    require('./api/remote-api').router,
    require('./api/node-api').router,
    require('./api/api').router,
    require('./api/transactions').router,
    require('./api/usages').router,
    require('./api/user').router,
    require('./api/service').router,
    require('./api/nodes').router,
];

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

routers.forEach(router => app.use(router));

createSocketServer(server);

server.listen(env.WEB_PORT ?? 8080, () =>  showInfo(`Server started on port ${env.WEB_PORT ?? 8080}`));