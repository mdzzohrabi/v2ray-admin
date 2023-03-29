// @ts-check
const { httpAction, db } = require('../lib/util');
const { createHash, randomUUID } = require('crypto');

const router = require('express').Router();

// Users list
router.get('/system/users', httpAction(async (req, res) => {

    /** @type {SystemUser[]} */
    let users = await db('system-users') ?? [];

    return users.map(({ password, ...user }) => user);
}));

// New User
router.post('/system/users', httpAction(async (req, res) => {

    /** @type {SystemUser[]} */
    let users = await db('system-users') ?? [];

    /** @type {SystemUser} */
    let user = req.body;

    if (!user && typeof user != 'object')
        throw Error('Invalid request');

    if (!user.username)
        throw Error('Username is required');

    if (!user.password)
        throw Error('Password is required');

    if (!!users.find(x => x.username == user.username))
        throw Error('User already exists');

    user.password = createHash('md5').update(user.password).digest('hex');
    user.id = randomUUID();

    users.push(user);

    await db('system-users', users);

    return { ok: true, message: 'User added successful' };
}));

// Update user
router.put('/system/users', httpAction(async (req, res) => {
    /** @type {SystemUser[]} */
    let users = await db('system-users') ?? [];

    /** @type {SystemUser} */
    let user = req.body;

    if (!user || typeof user != 'object')
        throw Error('Invalid request');

    let index = users.findIndex(x => x.id == user.id);

    if (index < 0) throw Error('User not found');

    let oldPassword = users[index].password;

    if (user.password) {
        user.password = createHash('md5').update(user.password).digest('hex');
    } else {
        user.password = oldPassword;
    }

    users[index] = user;

    await db('system-users', users);

    return { ok: true, message: 'User updated successful' };
}));

// Delete user
router.delete('/system/users', httpAction(async (req, res) => {
    /** @type {SystemUser[]} */
    let users = await db('system-users') ?? [];
    let { id } = req.body ?? {};

    if (!id)
        throw Error('Invalid request');

    let index = users.findIndex(x => x.id == id);

    if (index < 0)
        throw Error('User not found');

    users.splice(index, 1);

    await db('system-users', users);

    return { ok: true, message: 'User deleted successful' };
}));

router.get('/system/user/:user/sessions', httpAction(async (req, res) => {
    let {user: userId} = req.params;
    /** @type {LoginSession[]} */
    let sessions = await db('sessions') ?? [];

    return sessions.filter(x => x.userId == userId);
}));

router.delete('/system/user/:user/sessions', httpAction(async (req, res) => {
    let {user: userId} = req.params;
    let {token} = req.body;
    /** @type {LoginSession[]} */
    let sessions = await db('sessions') ?? [];
    
    sessions = sessions.filter(x => !(x.userId == userId && x.token == token));

    await db('sessions', sessions);

    return { ok: true, message: 'Session removed successful' };
}));

module.exports = { router };