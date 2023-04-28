// @ts-check

const { restartService } = require('../lib/util');
const router = require('express').Router();

router.post('/restart', async (req, res) => {
    restartService().then(result => res.json({ result }));
});


module.exports = { router };