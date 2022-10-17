// @ts-check
// Load envrionment configuration
require('dotenv').config();

const { resolve, join } = require('path');

/**
 * Type definitions
 * @typedef {{
 *      log?: {
 *          logLevel?: string
 *      },
 *      routing?: {
 *          domainStrategy?: string,
 *          rules?: { type?: string, ip?: string[], outboundTag?: string }[]
 *      },
 *      inbounds?: {
 *          listen?: string,
 *          port?: number,
 *          protocol?: string,
 *          settings?: {
 *              clients?: { id?: string, email?: string, level?: number }[]
 *          },
 *          streamSettings?: {
 *              network?: string,
 *              security?: string
 *          },
 *          tag?: string
 *      }[],
 *      outbounds?: {
 *          protocol?: string,
 *          tag?: string
 *      }[]
 * }} V2RayConfig
 */

/**
 * Cache read/write
 * @param {string}  key
 * @param {any}     value
 */
async function cache(key, value = undefined) {
    try {
        const {env} = require('process');
        const {readFile, writeFile} = require('fs/promises');
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
    let { argv } = require('process');

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
        const {readFileSync} = require('fs');
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

    let stream = require('fs').createReadStream(accessLogPath, {
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

module.exports = { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile };