// @ts-check
let express = require('express');
const { db } = require('../lib/util');
let router = express.Router();

/**
 * Remote request
 */
router.use(async (req, res, next) => {
    let serverNode = req.headers['server-node'];
    if (serverNode) {
        /**
         * @type {ServerNode[]}
         */
        let nodes = await db('server-nodes') ?? [];

        let node = nodes.find(x => x.id == serverNode);

        if (!node) {
            return res.json({ ok: false, message: 'Server node not found' });
        }

        let path = req.path;
        let fetch = (await import('node-fetch')).default;

        try {
            let result = await fetch(node.address + path, {
                body: req.method.toLowerCase() == 'post' ? req.body : undefined,
                method: req.method,
                headers: {
                    Authorization: 'Bearer ' + node.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            res.json(await result.json());
        } catch (err) {
            res.json({
                ok: false,
                message: `Cannot connect to node "${node.id}" to fetch "${path}" (${req.method})`,
                error: err?.message
            });
            console.error(err);
        }

    } else {
        next();
    }
})

module.exports = { router };