// @ts-check

const { resolve } = require('path');

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
        return require(resolve(configPath));
    } catch {
        throw Error(`Cannot read configuration file from "${configPath}"`);
    }
}

module.exports = { parseArgumentsAndOptions, createLogger, getPaths, readConfig };