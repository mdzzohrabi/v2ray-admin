// @ts-check
const { getPaths, watchFile } = require('../lib/util');

/**
 * 
 * @param {any} server 
 */
function createSocketServer(server) {
    const { Server } = require('socket.io');

    let socket = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: []
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
}

module.exports = { createSocketServer };