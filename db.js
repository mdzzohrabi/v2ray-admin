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
    try {
        if (await existsAsync(dbPath())) {
            return v2rayDb = JSON.parse((await readFile(dbPath())).toString('utf-8'));
        }
    } catch (err) {
        console.error(err);
    }
    return v2rayDb = {};
}

async function newId(key = 'global') {
    let db = await readDb();
    db.idCounter = db.idCounter ?? {};
    let newId = (db.idCounter[key] ?? 0) + 1;
    db.idCounter[key] = newId;
    saveDb();
    return newId;
}

/**
 * Write database to disk
 * @param {V2RayDb?} db Database
 */
async function saveDb(db = null) {
    if (!db) db = v2rayDb;
    await writeFile(dbPath(), JSON.stringify(db));
}

async function getTransactions() {
    return (await readDb()).transactions ?? [];
}

/**
 * Add transaction to database
 * @param {Transaction} transaction Transaction
 */
async function addTransaction(transaction) {
    let db = await readDb();
    db.transactions = db.transactions ?? [];
    transaction.id = await newId('transactions');
    transaction.createDate = transaction.createDate ?? (new Date().toLocaleString());
    db.transactions.push(transaction);
    await saveDb(db);
    return transaction;
}

module.exports = { saveDb, readDb, dbPath, getTransactions, addTransaction };