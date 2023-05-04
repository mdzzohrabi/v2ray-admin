// @ts-check
/// <reference types="../types"/>
// Load envrionment configuration
require('dotenv').config();

const { randomUUID } = require('crypto');
const { resolve, join, dirname } = require('path');
const { writeFile, readFile, copyFile, appendFile, stat, open, watch, mkdir, rename, unlink } = require('fs/promises');
const { readFileSync, createReadStream } = require('fs');
const { env, argv } = require('process');

/**
 * Check file exists async
 * @param {string} filePath File path
 * @returns {Promise<boolean>}
 */
async function existsAsync(filePath) {
    try {
        return (await stat(filePath)).isFile();
    }
    catch {
        return false;
    }
}

/**
 * Make directory if not exists
 * @param {string} path Path
 */
async function makeDirIfNotExists(path) {
    if (!existsAsync(path))
        await mkdir(path, { recursive: true });
}

/**
 * Write file atomic
 * @param {string} file File path
 * @param {string} content Content
 */
async function writeFileAtomic(file, content) {
    let tmpName = file + '.' + Math.round(Math.random() * 100000000);
    await writeFile(tmpName, content);
    try {
        await rename(tmpName, file);
    }
    catch (err) {
        try {
            await unlink(tmpName);
        } catch {}
        throw err;
    }
}


/**
 * Create collection manager
 * @param {string} path Collection directory path
 * @param {{
*      throwError?: boolean,
*      errorMesage?: string,
*      jsonPostfix?: boolean
* }} options Options
* @returns 
*/
function createCollectionManager(path, options = {}) {

    let { throwError = true, errorMesage, jsonPostfix = true } = options;

    /**
     * @template T
     * @param {string} key  Collection name 
     * @param {T?} value 
     * @returns {Promise<T?>}
     */
    async function collection(key, value = null) {
        let mode = arguments.length == 1 ? 'read' : 'write';
        try {
            // Resolve collection directory
            let resolvedCollectionDir = resolve(path);

            // Create collection directory if not exists
            await makeDirIfNotExists(resolvedCollectionDir);

            // Resolved collection file
            let collectionFile = resolve(join(resolvedCollectionDir, key)) + (jsonPostfix ? '.json' : '');

            // Write to collection
            if (mode == 'write') {
                await writeFileAtomic(collectionFile, JSON.stringify(value));
                return value;
            } else {
                return JSON.parse((await readFile(collectionFile)).toString('utf-8'));
            }
        }
        catch (err) {
            log(errorMesage ?? `Error ${mode == 'read' ? 'read from': 'write to'} collection "${key}" in "${path}"`);
            if (throwError)
                throw err;
            return null;
        }
    }
    
    return collection;
}

function cacheDir() {
    return env.CACHE_DIR ?? 'var';
}

const cache = createCollectionManager(cacheDir(), { throwError: false, jsonPostfix: false });

function dbDir() {
    return env.DB_DIR ?? 'db';
}


/**
 * Db collection read/write
 * @param {string}  key
 * @param {any}     value
 */
const db = createCollectionManager(dbDir(), { throwError: false });

/**
 * Write to log file
 * @param {string} string Log message
 */
async function log(string) {
    try {
        let cachePath = resolve(env.LOG ?? 'var/log.log');
        await makeDirIfNotExists(dirname(cachePath));
        await appendFile(cachePath, new Date() + ' - ' + string + "\n");
    } catch (err) {
        console.error(err);
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
                name = camelize(name).replace(/\-/g, '');
                cliOptions[name] = value ?? true;
            }
            else if (argv[i+1] && !argv[i+1].startsWith('--'))
            {
                /** @type {[string, string|boolean]} */
                let [name, value] = [ arg.slice(2), argv[++i] ];
                if (value == 'false') value = false;
                if (value == 'true') value = true;
                name = camelize(name).replace(/\-/g, '');
                cliOptions[name] = value ?? true;
            }
            else 
            {
                let name = arg.slice(2);
                name = camelize(name).replace(/\-/g, '');
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
        v2ray: env.V2RAY ? env.V2RAY?.match(/\/|\\/) ? resolve(env.V2RAY) : env.V2RAY : 'v2ray'
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
    } catch (err) {
        console.error(err)
        throw Error(`Cannot read configuration file from "${configPath}"`);
    }
}

/**
 * Write v2ray config
 * @param {string} configPath Config path
 * @param {any} config Config
 * @returns 
 */
async function writeConfig(configPath, config) {
    try {
        log(`Write V2Ray configuration into "${configPath}"`)
        let path = resolve(configPath);
        let backupPath = resolve(configPath + '.backup');
        await copyFile(path, backupPath);
        return await writeFileAtomic(path, JSON.stringify(config, null, 2));
    } catch {
        throw Error(`Cannot write configuration file from "${configPath}"`);
    }
}

/**
 * 
 * @param {string} accessLogPath Access Log Path
 * @returns {Promise<UserUsages>}
 */
async function readLogFile(accessLogPath) {

    /**
     * @type {UserUsages}
     */
    let usages = await db('user-usages') ?? {};
    let lines = readLogLines(accessLogPath, 'log-read-bytes');

    for await  (const line of lines) {
        let {user, dateTime} = line;
        let usage = usages[user] = usages[user] ?? {};
        if (!usage.firstConnect || dateTime < new Date(usage.firstConnect))
            usage.firstConnect = dateTime.toString();

        if (!usage.lastConnect || dateTime > new Date(usage.lastConnect)) {
            usage.lastConnect = dateTime.toString();
            usage.lastConnectNode = 'local';
            let ip = line.clientAddress?.split(':');
            if (ip)
                usage.lastConnectIP = ip[ip.length - 2];
        }
    }

    await db('user-usages', usages);
    return usages;
}

/**
 * 
 * @param {string} accessLogPath 
 * @param {string | undefined} cacheKey 
 */
async function *readLogLines(accessLogPath, cacheKey = undefined) {
    let readedBytes = cacheKey ? await cache(cacheKey) ?? 0 : 0;

    let stream = createReadStream(accessLogPath, {
        start: readedBytes
    });

    let lineReader = require('readline').createInterface({
        input: stream
    });

    let offset = readedBytes + stream.bytesRead;

    for await (const line of lineReader) {
        let size = line?.length + 1;
        offset += size;
        let parsed = parseLogLine(line);
        if (!parsed) continue;
        yield { ...parsed, offset: offset - size };
    }
    if (cacheKey)
        await cache(cacheKey, readedBytes + stream.bytesRead);
}

/**
 * 
 * @param {string} accessLogPath Access log path
 * @param {number} fromOffset From Offset
 * @param {number?} toOffset To Offset
 */
async function *readLogLinesByOffset(accessLogPath, fromOffset = 0, toOffset = null) {
    let stream = createReadStream(accessLogPath, {
        start: fromOffset
    });

    let lineReader = require('readline').createInterface({
        input: stream
    });

    let offset = fromOffset + stream.bytesRead;

    for await (const line of lineReader) {
        let size = line?.length + 1;
        offset += size;
        if (toOffset && stream.bytesRead > toOffset) break;
        let parsed = parseLogLine(line);
        if (!parsed) continue;
        yield { ...parsed, offset: offset - size };
    }
}

/**
 * Parse log line
 * @param {string} line Log line
 */
function parseLogLine(line) {
    let [date, time, clientAddress, status, destination, route, email, user] = line.split(' ');
    if (!user) return null;
    user = user.trim();
    let dateTime = new Date(date + ' ' + time);
    return {date, time, clientAddress, status, destination, route, email, user, dateTime};
}

/**
 * Read a file line by line
 * @param {string} filePath Access log path
 * @param {number | undefined} start Start offset of reading file
 */
async function *readLines(filePath, start = undefined) {
    if (!start)
        start = (await stat(filePath)).size;
    let stream = createReadStream(filePath, {
        start
    });

    let lineReader = require('readline').createInterface({
        input: stream
    });

    for await (const line of lineReader) {
        yield line;
    }
}

/**
 * 
 * @param {string} filePath 
 * @param {AbortController} abortController 
 */
async function *watchFile(filePath, abortController) {
    const watcher = watch(filePath, { encoding: 'utf8', signal: abortController.signal });
    const bufferSize = 5 * 1024;
    const buffer = Buffer.alloc(bufferSize);
    for await (const event of watcher) {
        if (event.eventType == 'change') {
            let size = (await stat(filePath)).size;
            let handle = await open(filePath);
            let result = await handle.read(buffer, 0, Math.min(size, bufferSize), Math.max(size - bufferSize, 0));
            handle.close();
            if (result.bytesRead > 0)
            {
                let lines = buffer.subarray(0, result.bytesRead).toString('utf-8').split('\n');
                let line = lines.pop();
                if (!line) line = lines.pop();
                yield line;
            }
        }
    }
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
 * Find user in all inbounds
 * @param {V2RayConfig} config Config
 * @param {string} email Email
 * @param {string?} tag Tag
 * @returns {V2RayConfigInboundClient | undefined}
 */
function findUser(config, email, tag = null) {
    return config?.inbounds?.filter(x => !tag || x.tag == tag).map(x => x.settings?.clients?.find(u => u.email == email)).filter(x => !!x).pop();
}

/**
 * Find user in all inbounds
 * @param {V2RayConfig} config Config
 * @param {string?} tag Tag
 * @param {string} email Email
 * @returns {V2RayConfigInboundClient[]}
 */
function findUsers(config, email, tag = null) {
    return config?.inbounds?.filter(x => !tag || x.tag == tag).flatMap(x => x.settings?.clients?.filter(u => u.email == email) ?? []) ?? [];
}

/**
 * Find user inbounds
 * @param {V2RayConfig} config Config
 * @param {string} email Email
 * @returns {V2RayConfigInbound[]}
 */
function findUserInbounds(config, email) {
    return config?.inbounds?.filter(x => x.settings?.clients?.find(u => u.email == email) != null) ?? [];
}

/**
 * Add user to a protocol
 * @param {string} configPath Config path
 * @param {string} email Email
 * @param {string} protocol Protocol
 * @param {string?} tag Tag
 * @param {Partial<V2RayConfigInboundClient>?} userInfos User information
 * @returns {Promise<V2RayConfigInboundClient>}
 */
async function addUser(configPath, email, protocol, tag = null, userInfos = null) {
    invariant(!!email, `Email must not be empty`);

    showInfo(`Add user "${email}" for protocol "${protocol}"${tag ? ` with tagged [${tag}]` : ''}`);

    // Configuration
    let config = readConfig(configPath);

    invariant(Array.isArray(config.inbounds), 'No inbounds defined in configuration');

    let foundInbound = config?.inbounds?.find(i => !!i.settings?.clients?.find(x => x.email == email));

    if (foundInbound)
        throw Error(`User "${email}" already exists in "${foundInbound.tag} (${foundInbound.protocol})"`)

    let inbound = config.inbounds?.find(x => x.protocol == protocol && (!tag || x.tag == tag));

    if (!inbound)
        throw Error(`No inbound found for protocol "${protocol}"`);

    log(`Add user ${email} to inbound ${tag} [${protocol}]`);

    let id = randomUUID();

    let user = { id, email, level: 0, createDate: String(new Date()), ...(userInfos ?? {}) };
    let users = inbound.settings?.clients ?? [];

    if (!Array.isArray(users))
        throw Error(`settings.clients is not in valid format for protocol "${protocol}"`);

    users.push(user);

    // Add Clients
    if (!inbound?.settings) inbound.settings = {};
    inbound.settings.clients = users;

    // Write config
    await writeConfig(configPath, config);

    return user;
}

/**
 * Delete user
 * @param {string} configPath 
 * @param {string} email 
 * @param {string} protocol 
 * @param {string?} tag 
 */
async function deleteUser(configPath, email, protocol, tag = null) {
    invariant(!!email, `Email must not be empty`);

    showInfo(`Remove user "${email}" from protocol "${protocol}"${tag ? ` with tagged [${tag}]` : ''}`);

    // Configuration
    let config = readConfig(configPath);

    let inbound = config?.inbounds?.find(x => x.protocol == protocol && (!tag || x.tag == tag));
    let clients = inbound?.settings?.clients;
    let newClients = clients?.filter(u => u.email != email);

    if (Array.isArray(newClients)) {
        let found = clients?.find(u => u.email == email);

        if (!found) {
            throw Error(`User "${email}" not found`);
        }
        log(`Remove user "${email}" from inbound ${tag}`);

        // @ts-ignore
        inbound.settings.clients = newClients;

        await writeConfig(configPath, config);
        return found;
    } else {
        throw Error(`settings.clients is not in valid format for protocol "${protocol}"`);
    }
}

/**
 * Get client configuration
 * @param {V2RayConfigInboundClient} user Client
 * @param {string} tag
 */
async function getUserConfig(user, tag) {
    let {configPath} = getPaths();
    let {inbounds} = readConfig(configPath);
    let inbound = inbounds?.find(x => x.tag == tag);

    let inboundConfigs = inbound?.clientConfigs ?? [];

    if (inboundConfigs.length == 0) inboundConfigs.push({});
    let clientConfigs = [];
    let strConfigs = [];

    inboundConfigs.forEach(config => {
        let serverAddress = config?.address ?? env.V2RAY_SERVER ?? 'n1.inetwork.pw';
        let configPrefix = config?.prefix ?? (`VIP-${inbound?.streamSettings?.network ?? 'tcp'}-${inbound?.streamSettings?.security == 'tls' ? '-tls-' : ''}`);
        let configName = configPrefix + user.email;
    
        if (!!user.deActiveDate && !user.deActiveReason?.startsWith('#'))
            configName += ` [${user.deActiveReason}]`;
    
        let clientConfig = {
            "add": serverAddress,
            "aid": "0",
            "alpn": inbound?.streamSettings?.tlsSettings?.alpn?.join(',') ?? '',
            "host": config?.host ?? "google.com",
            "id": user.id,
            "net": inbound?.streamSettings?.network ?? "tcp",
            "path": inbound?.streamSettings?.network == 'tcp' ? "/" : '',
            "port": `${config?.port ?? inbound?.port}`,
            "ps": configName,
            "scy": "auto",
            "sni": config?.sni ?? "",
            "tls": inbound?.streamSettings?.security == 'tls' ? 'tls' : "",
            "type": inbound?.streamSettings?.tcpSettings?.header?.type ?? "",
            "v": "2"
        };

        let strConfig = '';
        
        if (inbound?.protocol == 'vless') {
            strConfig = (`vless://${clientConfig.id}@${clientConfig.add}:${clientConfig.port}?path=%2F&host=${clientConfig.host}&security=${inbound?.streamSettings?.security=='tls'?'tls':'none'}&encryption=${inbound?.settings?.decryption ?? 'none'}&headerType=${clientConfig.type}&type=${clientConfig.net}&alpn=${clientConfig.alpn}&sni=${serverAddress}#${configName}`);
        } else {
            strConfig = (`${inbound?.protocol}://${Buffer.from(JSON.stringify(clientConfig)).toString('base64')}`);
        }

        strConfigs.push(strConfig);
    
        clientConfigs.push({
            ...clientConfig,
            strConfig,
            description: config?.description
        })
    });

    return {clientConfig: clientConfigs[0], strClientConfig: strConfigs.join('\n'), strConfigs, clientConfigs};
}

/**
 * @param {V2RayConfig} config
 * @param {string?} tag
 * @param {string} email
 * @param {boolean} active
 * @param {string | undefined} reason
 */
function setUserActive(config, tag, email, active, reason = undefined, outboundTag = 'baduser') {
    log(`Set user ${email} in inbound "${tag ?? '*'}" to ${active?'active':'de-active'}.${reason? ' reason: ' + reason: ''}`);

    let users = findUsers(config, email, tag);
    if (users.length == 0)
        throw Error(`User ${email} not found`);
        
    // Routing rule to add user
    let routeRule = config?.routing?.rules?.find(x => x.outboundTag == outboundTag);

    for (let user of users) {
        // Active user
        if (active) {
            // Re-new billing date
            if (user.deActiveReason?.includes('Expired')) {
                user.billingStartDate = String(new Date());
                log(`Re-active "${email}" from expired`);
            }
            delete user.deActiveDate;
            delete user.deActiveReason;
            if (routeRule) {
                let index = routeRule.user?.indexOf(email) ?? -1;
                if (index >= 0) {
                    routeRule.user?.splice(index, 1);
                }
            }
        } else {
        // De-active user
            user.deActiveDate = new Date().toString();
            user.deActiveReason = reason;
            if (routeRule) {
                if (Array.isArray(routeRule.user)) {
                    if (!routeRule.user.includes(email))
                        routeRule.user.push(email);
                }
                else
                    routeRule.user = [email];
            }
        }
    }

    return users;
}

function restartService() {
    return new Promise((done, reject) => {
        log(`Restart v2ray service`);
        const {exec} = require('child_process');
        let result = exec('systemctl restart v2ray');
        if (!result) return reject();
        let output = '';
        result?.stdout?.on('data', buffer => {
            output += buffer.toString('utf-8');
        });

        result?.once('exit', () => {
            done(output);
        });
        
        result?.once('error', (err) => {
            reject(err)
        });    
    })
}

let intlYearMonth = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric', year: 'numeric' });

const DateUtil = {

    /**
     * Add days to given date
     * @param {any} date Date
     * @param {number} days Days to add
     * @returns 
     */
    addDays(date, days) {
        if (!date) return undefined;
        return new Date(new Date(date).getTime() + (days * 24 * 60 * 60 * 1000));
    },

    /**
     * Date diff
     * @param {string | number | Date} date1 
     * @param {string | number | Date | undefined} date2 
     */
    dateDiff(date1, date2 = undefined) {
        let d1 = new Date(date1);
        let d2 = new Date(date2 ?? Date.now());
        let diff = d2.getTime() - d1.getTime();
        let ago = diff >= 0;
        diff = Math.abs(diff);
        let totalSeconds = diff / 1000;
        let totalMinutes = totalSeconds / 60;
        let totalHours = totalMinutes / 60;
        let totalDays = totalHours / 24;
        let totalMonths = totalDays / 30;
        let totalYears = totalDays / 365;
    
        let aMinute = 60 * 1000;
        let aHour = 60 * aMinute;
        let aDay = 24 * aHour;
        let aMonth = 30 * aDay;
        let aYear = 365 * aDay;
    
        let years = Math.floor(diff / aYear);
        let months = Math.floor(diff % aYear / aMonth);
        let days = Math.floor(diff % aMonth / aDay);
        let hours = Math.floor(diff % aDay / aHour);
        let minutes = Math.floor(diff % aHour / aMinute);
        let seconds = Math.floor(diff % aMinute / 1000);
    
        let texts = [];
        if (years > 0) texts.push(`${years} سال`);
        if (months > 0) texts.push(`${months} ماه`);
        if (days > 0) texts.push(`${days} روز`);
        if (hours > 0) texts.push(`${hours} ساعت`);
        if (minutes > 0) texts.push(`${minutes} دقیقه`);
        if (months == 0 && years == 0 && days == 0 && hours == 0 && seconds > 0) texts.push(`${seconds} ثانیه`);
    
        let text = texts.join(' ') + (ago ? ' پیش' : ' مانده');
    
        return {totalYears, totalMonths, totalDays, totalHours, totalMinutes, totalSeconds, years, months, days, hours, minutes, seconds, text, ago};
    },

    /**
     * Check if two date has same jalali month
     * @param {Date} date1 
     * @param {Date} date2 
     */
    isSameJMonth(date1, date2) {
        return intlYearMonth.format(date1) == intlYearMonth.format(date2);
    },

    /**
     * 
     * @param {string|Date|number} date 
     * @returns 
     */
    toDate(date) {
        if (date instanceof Date) return date;
        return new Date(typeof date == 'string' ? date.replace(' ', ' ') : date);
    }

}

/**
 * 
 * @param {any} a 
 * @param {any} b 
 */
function equals(a, b) {
    if (a===b) return true;
    if (typeof a != typeof b) return false;
    return JSON.stringify(a) == JSON.stringify(b);
}

/**
 * 
 * @param {any} value Value
 * @param {Change[]} changes Changes
 */
function applyChanges(value, changes) {
    let result = deepCopy(value);
    changes?.forEach(change => {
        let path = change.path?.map(x => typeof x == 'string' ? `"${x}"` : x).join('][');
        let parentPath = change.path?.slice(0, change.path.length - 1).map(x => typeof x == 'string' ? `"${x}"` : x).join('][');
        if (parentPath) parentPath = `[${parentPath}]`;
        switch (change.action) {
            case 'set': {
                if (change.path?.length == 0)
                    result = change.value;
                else {
                    let parentNode = [];
                    eval(`parentNode = result${parentPath}`);
                    if (Array.isArray(parentNode)) {
                        if (change.prevValue) {
                            let index = parentNode.findIndex(x => equals(x, change.prevValue));
                            if (index >= 0)
                                parentNode[index] = change.value;
                            // else
                            //     parentNode.push(change.value);
                        }
                        else {
                            parentNode.push(change.value);
                        }
                    }
                    else {
                        eval(`result[${path}] = change.value;`);
                    }
                }
                break;
            }
            case 'delete': {
                if (change.value) {
                    let arr = [];
                    eval(`arr = result[${path}];`);
                    eval(`result[${path}] = arr.filter(x => !equals(x, change.value));`);
                }
                else {
                    eval(`delete result[${path}];`);
                }
                break;
            }
            case 'add': {
                eval(`result[${path}].push(change.value);`);
            }
        }
    });
    return result;
}


/**
 * Deep copy of a value
 * @param {any} value Value
 */
function deepCopy(value) {
    if (typeof value != 'object') return value;
    return JSON.parse(JSON.stringify(value));
}

/**
 * Camel-case an string
 * @param {string} str String
 * @returns 
 */
function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

/**
 * @template T
 * @param {T[]} arr1 
 * @param {T[]} arr2 
 * @param {(value: T) => any} key 
 * @param {((value: T) => boolean)?} deleteCondition
 * @param {((value: T, newValue: T) => boolean)?} modifyCondition
 */
function arrSync(arr1, arr2, key, deleteCondition = null, modifyCondition = null) {
    
    let result = {
        result: arr1,

        /** @type {T[]} */
        inserted: [],

        /** @type {T[]} */
        removed: [],

        /** @type {T[]} */
        modified: []
    }

    for (let item of arr2) {
        let found = arr1.find(x => key(x) == key(item));
        // Update
        if (found) {
            if ((!modifyCondition || modifyCondition(found, item)) && !equals(found, item)) {
                let index = arr1.indexOf(found);
                arr1[index] = item;
                result.modified.push(item);
            }
        }
        // Insert
        else {
            arr1.push(item);
            result.inserted.push(item);
        }
    }

    if (deleteCondition) {
        arr1 = arr1.filter(item => {
            let notRemoved = !deleteCondition(item) || arr2.find(x => key(x) == key(item));
            if (!notRemoved)
                result.removed.push(item);
            return notRemoved;
        });
    }

    result.result = arr1;

    return result;
}

function humanizeSize(size) {
    if (!size) return size;

    let postfix = ['B', 'KB', 'MB', 'GB', 'TB', 'EB'];
    let index = 0;
    while (size > 1024) {
        size = size / 1024;
        index++;
    }

    return Math.round(size) + ' ' + postfix[index];
}

/**
 * Ping and return time in ms
 * @param {string} url Url
 * @returns Promise<number>
 */
function ping(url) {
    return new Promise((done, fail) => {
        let { hostname, port, protocol } = require('url').parse(url);
        if (!hostname) return fail(Error('Invalid URL'));
        if (!port) {
            port = protocol == 'https:' ? '443' : '80';
        }
        let startMs = Date.now();
        let socket = require('net').createConnection(Number(port), hostname);
        socket.setTimeout(5000);
        socket.on('connect', () => {
            socket.end();
            done(Date.now() - startMs);
        });
        socket.on('timeout', () => {
            socket.destroy();
            fail(Error('Connection timeout'));
        });
        socket.on('error', () => {
            socket.destroy();
            fail(Error('Connection error'));
        });
    });
}

/**
 * 
 * @param {import('express').RequestHandler<any, any, any, any, any>} fn 
 * @returns 
 */
function httpAction(fn) {
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    return async function errorHandlededAction(req, res, next) {
        try {
            let result = await fn(req, res, next);
            if (typeof result != 'undefined')
                res.json(result);
        }
        catch (err) {
            res.json({ ok: false, error: err?.message });
        }
    }
}

/**
     * 
     * @param {ServerNode} serverNode 
     * @param {string} action 
     * @param {string} method 
     * @param {any} body 
     * @param {number|undefined} timeout
     * @returns {Promise<any>}
    */
async function serverNodeRequest(serverNode, action, method = 'GET', body = undefined, timeout = undefined) {
    const { default: fetch } = await import('node-fetch');
    const abortController = new AbortController();

    /** @type {NodeJS.Timeout?} */
    let timerId = null;

    if (timeout) {
        timerId = setTimeout(() => abortController.abort(), timeout);
    }

    try {
        let result = await fetch(serverNode.address + action, {
            method,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                'Authorization': 'Bearer ' + Buffer.from(serverNode.apiKey, 'utf-8').toString('base64'),
                'Content-Type': 'application/json'
            },
            signal: abortController.signal
        });

        return await result.json();
    }
    catch (err) {
        showError(err?.message);
    }
    finally {
        if (timerId)
            clearTimeout(timerId);
    }
}

/**
 * 
 * @param {import('express').Request} req Request
 * @param {any[]} items
 */
function applyFieldSelector(req, items) {
    /** @type {any} */
    let fields = req.query?.fields;
    if (fields) {
        /** @type {string[]} */
        let arrFields = Array.isArray(fields) ? fields : String(fields).split(',');
        return items.map(x => {
            let result = {};
            arrFields.forEach(key => result[key] = x[key]);
            return result;
        });
    }
    return items;
}

module.exports = { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile, addUser, getUserConfig, restartService, readLogLines, findUser, setUserActive, writeConfig, deleteUser, cache, log, readLines, parseLogLine, watchFile, existsAsync, cacheDir, DateUtil, applyChanges, deepCopy, readLogLinesByOffset, db, dbDir, findUsers, findUserInbounds, camelize, arrSync, writeFileAtomic, createCollectionManager, humanizeSize, ping, httpAction, serverNodeRequest, applyFieldSelector };