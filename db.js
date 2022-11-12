// @ts-check

const { readFile, writeFile } = require("fs/promises");
const { resolve, join } = require("path");
const { env } = require("process");
const { cacheDir, existsAsync, log } = require("./util");

function dbPath() {
    return env.V2RAY_DB ?? resolve(join(cacheDir(), 'db.json'));
}

/**
 * @type {V2RayDb | null}
 */
let v2rayDb = null;

/**
 * Get V2Ray database
 * @returns {Promise<V2RayDb>}
 */
async function readDb() {
    if (v2rayDb) return v2rayDb;
    if (await existsAsync(dbPath())) {
        return v2rayDb = JSON.parse((await readFile(dbPath())).toString('utf-8'));
    }
    return {};
}

async function newId() {
    
}

/**
 * Write database to disk
 * @param {V2RayDb?} db Database
 */
async function writeDb(db = null) {
    if (!db) db = v2rayDb;
    await writeFile(dbPath(), JSON.stringify(db));
}

async function getTransactions() {
    return (await readDb()).transactions;
}

async function addTransaction(transaction) {
    let db = await readDb();
    db.transactions = db.transactions ?? [];
    db.transactions.push(transaction);
    await writeDb(db);
}

module.exports = { writeDb, readDb, dbPath, getTransactions, addTransaction };