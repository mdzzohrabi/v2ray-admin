// @ts-check

const { randomUUID } = require('crypto');
const { httpAction, db, createLogger } = require('../lib/util');

const router = require('express').Router();
const {showError} = createLogger();


router.get('/nodes', httpAction(async (req, res) => {
    /** @type {ServerNode[]} */
    let nodes = await db('server-nodes') ?? [];
    let {all} = req.query;

    return nodes.filter(x => !all ? !x.disabled : true);
}));

router.post('/nodes', async (req, res) => {
    try {
        /** @type {Partial<ServerNode>} */
        let { address, type = 'client', sync = false, apiKey, name, disabled, show_in_home, show_in_other_nodes, syncConfig, readLastMinutesLogs } = req.body;

        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        if (nodes.find(x => x.address == address)) {
            res.json({ ok: false, error: 'This Node already exists' });
            return;
        }

        nodes.push({
            name,
            id: randomUUID(),
            apiKey: type == 'client' ? randomUUID() : apiKey ?? '',
            address,
            type,
            sync,
            syncConfig,
            show_in_home,
            show_in_other_nodes,
            disabled,
            readLastMinutesLogs
        });

        await db('server-nodes', nodes);

        res.json({ ok: true, message: 'Server node added successful' });
    }
    catch (err) {
        res.json({ error: err.message });
        showError(err);
    }
});

router.put('/nodes', async (req, res) => {
    try {
        /** @type {Partial<ServerNode>} */
        let { id, type, address, sync, name, apiKey, disabled, show_in_home, show_in_other_nodes, syncConfig, readLastMinutesLogs } = req.body;

        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        let node = nodes.find(x => x.id == id);

        if (!node) {
            res.json({ ok: false, error: 'Node not found' });
            return;
        }

        node.name = name;
        if (apiKey && type == 'server')
            node.apiKey = apiKey;
        node.address = address;
        node.type = type;
        node.sync = sync;
        node.disabled = disabled;
        node.show_in_home = show_in_home;
        node.show_in_other_nodes = show_in_other_nodes;
        node.syncConfig = syncConfig;
        node.readLastMinutesLogs = readLastMinutesLogs;

        await db('server-nodes', nodes);

        res.json({ ok: true, message: 'Node changed successful' });
    }
    catch (err) {
        res.json({ error: err.message });
        showError(err);
    }
});

router.delete('/nodes', async (req, res) => {
    try {
        let { id } = req.body;
        /** @type {ServerNode[]} */
        let nodes = await db('server-nodes') ?? [];

        nodes = nodes.filter(x => x.id != id);

        await db('server-nodes', nodes);

        res.json({ ok: true, message: 'Node removed successful' });
    }
    catch (err) {
        res.json({ error: err.message });
        showError(err);
    }
});

module.exports = { router };