// @ts-check
const { getTransactions, addTransaction, readDb, saveDb } = require('../lib/db');
const { httpAction } = require('../lib/util');

const router = require('express').Router();

router.get('/transactions', httpAction(async (req, res) => {
    /** @type {SystemUser} */
    let admin = res.locals.user;
    let transactions = await getTransactions();
    if (!admin.acls?.isAdmin) {
        transactions = transactions.filter(x => x.createdFor == admin.username || x.createdBy == admin.username || (x.createdFor && admin.subUsers?.includes(x.createdFor)));
    }
    res.json(transactions);
}));


router.post('/transactions', async (req, res) => {
    /** @type {SystemUser?} */
    let user = res.locals.user;
    try {
        let result = await addTransaction({ ...req.body, createdBy: user?.username, createdById: user?.id });
        res.json({ transaction: result });
    }
    catch (err) {
        res.json({ error: err.message });
    }
});

router.post('/remove_transaction', async (req, res) => {
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

router.post('/edit_transaction', async (req, res) => {
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

module.exports = { router };
