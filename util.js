// @ts-check
// Load envrionment configuration
require('dotenv').config();

const { randomUUID } = require('crypto');
const { resolve, join } = require('path');
const { writeFile, readFile } = require('fs/promises');
const { readFileSync, createReadStream } = require('fs');
const { env, argv } = require('process');

/**
 * Cache read/write
 * @param {string}  key
 * @param {any}     value
 */
async function cache(key, value = undefined) {
    try {
        let cachePath = resolve(join(env.CACHE_DIR ?? 'var', key));
        if (typeof value !== 'undefined') {
            await writeFile(cachePath, JSON.stringify(value));
        } else {
            return JSON.parse((await readFile(cachePath)).toString('utf-8'));
        }
    } catch (err) {
        return null;
    }
}

function parseArgumentsAndOptions() {
    // Command-line Arguments
    const cliArguments = [];

    // Command-line Options
    const cliOptions = {};

    // Parse cli arguments
    for (let i = 2; i < argv.length; i++) {
        let arg = argv[i];
        if (arg.startsWith('--')) {
            if (arg.indexOf('=') >= 0) {
                /** @type {any[]} */
                let [name, value] = arg.slice(2).split('=');
                if (value == 'false') value = false;
                if (value == 'true') value = true;
                cliOptions[name] = value ?? true;
            }
            else if (argv[i+1] && !argv[i+1].startsWith('--'))
            {
                /** @type {[string, string|boolean]} */
                let [name, value] = [ arg.slice(2), argv[++i] ];
                if (value == 'false') value = false;
                if (value == 'true') value = true;
                cliOptions[name] = value ?? true;
            }
            else 
            {
                let name = arg.slice(2);
                cliOptions[name] = true;
            }
        } else {
            cliArguments.push(arg);
        }
    }

    return { cliArguments, cliOptions };
}

const showError = (...err) => console.error(`[Error]`, ...err);
const showOk = (...message) => console.log('[OK]', ...message);
const showInfo = (...message) => console.log('[Info]', ...message);
const showDebug = (...message) => console.log('[Debug]', ...message);
const showWarn = (...message) => console.log('[Warning]', ...message);

const createLogger = (before = '', after = '') => ({
    showError: (...args) => showError(before, ...args, after),
    showOk: (...args) => showOk(before, ...args, after),
    showInfo: (...args) => showInfo(before, ...args, after),
    showWarn: (...args) => showWarn(before, ...args, after)
});

function getPaths() {
    let { env } = require('process');
    return {
        configPath: env.V2RAY_CONFIG ?? '/usr/local/etc/v2ray/config.json',
        accessLogPath: env.V2RAY_ACCESS_LOG ?? '/var/log/v2ray/access.log',
        errorLogPath: env.V2RAY_ERROR_LOG ?? '/var/log/v2ray/error.log',
    }
}

/**
 * Read v2ray configuration
 * @param {string} configPath 
 * @returns {V2RayConfig}
 */
function readConfig(configPath) {
    try {
        return JSON.parse(readFileSync(resolve(configPath)).toString('utf-8'));
    } catch {
        throw Error(`Cannot read configuration file from "${configPath}"`);
    }
}

/**
 * 
 * @param {string} accessLogPath Access Log Path
 * @returns {Promise<{ [user: string]: { firstConnect: Date, lastConnect: Date } }>}
 */
async function readLogFile(accessLogPath) {

    /**
     * @type {{ [user: string]: { firstConnect: Date, lastConnect: Date } }}
     */
    let usages = await cache('usages') ?? {};
    let readedBytes = await cache('log-read-bytes') ?? 0;

    let stream = createReadStream(accessLogPath, {
        start: readedBytes
    });

    let lineReader = require('readline').createInterface({
        input: stream
    });

    for await  (const line of lineReader) {
        let [date, time, clientAddress, status, destination, route, email, user] = line.split(' ');
        if (!user) continue;
        user = user.trim();
        let usage = usages[user] = usages[user] ?? {};
        let dateTime = new Date(date + ' ' + time);
        if (!usage.firstConnect || dateTime < usage.firstConnect)
            usage.firstConnect = dateTime;

        if (!usage.lastConnect || dateTime > usage.lastConnect)
            usage.lastConnect = dateTime;
    }

    await cache('usages', usages);
    await cache('log-read-bytes', readedBytes + stream.bytesRead);

    return usages;
}

/**
 * Invariant
 * @param {any} expr Expression
 * @param {string} message Error Message
 * @param  {...any} params Error Message Params
 */
function invariant(expr, message, ...params) {
    if (!expr) {
        let index = 0;
        let error = Error(message.replace(/%s/g, () => params[index--]));
        error['framesToPop'] = 1; // we don't care about invariant's own frame
        throw error;
    }
}

/**
 * Add user to a protocol
 * @param {string} configPath Config path
 * @param {string} email Email
 * @param {string} protocol Protocol
 * @param {string?} tag Tag
 * @returns {Promise<V2RayConfigInboundClient>}
 */
async function addUser(configPath, email, protocol, tag = null) {
    invariant(!!email, `Email must not be empty`);

    showInfo(`Add user "${email}" for protocol "${protocol}"${tag ? ` with tagged [${tag}]` : ''}`);

    // Configuration
    let config = readConfig(configPath);

    invariant(Array.isArray(config.inbounds), 'No inbounds defined in configuration');

    let inbound = config.inbounds?.find(x => x.protocol == protocol && (!tag || x.tag == tag));

    if (!inbound)
        throw Error(`No inbound found for protocol "${protocol}"`);

    let id = randomUUID();

    let user = { id, email, level: 0 };
    let users = inbound.settings?.clients ?? [];

    if (!Array.isArray(users))
        throw Error(`settings.clients is not in valid format for protocol "${protocol}"`);

    if (users.find(x => x.email == email)) {
        throw Error(`User "${email}" already exists`)
    }

    users.push(user);

    // Add Clients
    if (!inbound?.settings) inbound.settings = {};
    inbound.settings.clients = users;

    // Write config
    await writeFile(configPath, JSON.stringify(config, null, 2));

    return user;
}

/**
 * Get client configuration
 * @param {V2RayConfigInboundClient} user Client
 * @param {string} protocol
 */
function getUserConfig(user, protocol) {
    let clientConfig = {"add":"171.22.27.137","aid":"0","host":"","id":user.id,"net":"ws","path":"","port":"10808","ps":"VIP-" + user.email,"scy":"chacha20-poly1305","sni":"","tls":"","type":"","v":"2"}
    let strClientConfig = `${protocol}://${Buffer.from(JSON.stringify(clientConfig)).toString('base64')}`;
    return {clientConfig, strClientConfig};
}

module.exports = { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile, addUser, getUserConfig };