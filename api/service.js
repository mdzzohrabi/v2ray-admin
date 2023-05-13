// @ts-check
const { restartService, httpAction, execAsync } = require('../lib/util');
const router = require('express').Router();

router.post('/restart', async (req, res) => {
    restartService().then(result => res.json({ result }));
});

router.get('/service/generate_public_private_key', httpAction(async (req, res) => {
    let {stderr, stdout} = await execAsync('xray x25519');
    let [line1, line2] = stdout?.split('\n');
    let privateKey = line1.startsWith('Private key: ') ? line1.replace('Private key: ', '') : '';
    let publicKey = line1.startsWith('Public key: ') ? line2.replace('Public key: ', '') : '';
    return {privateKey, publicKey};
}))

module.exports = { router };