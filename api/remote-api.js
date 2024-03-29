// @ts-check
let express = require('express');
const { db } = require('../lib/util');
let router = express.Router();

/**
 * Remote request
 */
router.use(async (req, res, next) => {
    let serverNode = req.headers['server-node'];
    /** @type {SystemUser} */
    let admin = res.locals.user;
    if (admin) {
        let { password, ...adminWithoutPassword } = admin;
        admin = adminWithoutPassword;
    }
    if (serverNode) {
        /**
         * @type {ServerNode[]}
         */
        let nodes = await db('server-nodes') ?? [];

        let node = nodes.find(x => x.id == serverNode);

        if (!node) {
            return res.json({ ok: false, message: 'Server node not found' });
        }

        let path = req.url;
        let fetch = (await import('node-fetch')).default;

        try {
            let result = await fetch(node.address + path, {
                body: ['post', 'put', 'delete'].includes(req.method.toLowerCase()) ? JSON.stringify(req.body) : undefined,
                method: req.method,
                headers: {
                    Authorization: 'Bearer ' + Buffer.from(node.apiKey).toString('base64'),
                    'Content-Type': 'application/json',
                    'X-User': Buffer.from(JSON.stringify(admin)).toString('base64')
                }
            });

            res.json(await result.json());
        } catch (err) {
            res.json({
                ok: false,
                message: `Cannot connect to node "${node.name}" to fetch "${path}" (${req.method})`,
                error: err?.message
            });
            console.error(err);
        }

    } else {
        next();
    }
})

module.exports = { router };