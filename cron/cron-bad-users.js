// @ts-check

const { env } = require("process");
const { getPaths, readLogLines, cache, findUser, setUserActive, createLogger } = require("../lib/util");

/**
 * Cron Bad Users
 * @param {import("./cron").CronContext} cron Cron context
 */
async function cronBadUsers(cron, range = 1, reActiveUsers = true) {
    let { showInfo } = createLogger();

    showInfo(`Start Bad Users Cron`)

    let fromDate = new Date();
    let rangeMinutes = range;
    fromDate.setMinutes(fromDate.getMinutes() - rangeMinutes);
    
    let { accessLogPath } = getPaths();
    let { config } = cron;

    /**
     * @type {{ [user: string]: { [ip: string]: { order: number, lastAccessDate: Date, accessTimes: number } } }}
     */
    let users = {};
    let lines = readLogLines(accessLogPath, `last-${rangeMinutes}-minutes-bytes`);
    let lastMinutesRecords = await cache(`last-${rangeMinutes}-minutes`) ?? [];

    // Read log lines
    for await (let line of lines) {
        let {dateTime, status} = line;
        if (status != 'accepted') continue;
        if (dateTime < fromDate) continue;
        lastMinutesRecords.push(line);
    }

    // Old log lines from cache that is not in time range
    let removed = [];
    for (let line of lastMinutesRecords) {
        let {clientAddress, user, dateTime} = line;
        if (new Date(dateTime) < fromDate) {
            removed.push(line);
            continue;
        }
        // Users ip access
        let splits = clientAddress.split(':');
        let clientIpAddress = splits[splits.length - 2];
        let clientIps = users[user] = users[user] ?? {};
        let ipCounter = Object.values(clientIps).length;
        let clientIP = clientIps[clientIpAddress] ?? { order: ipCounter, accessTimes: 1 };
        clientIP.lastAccessDate = dateTime;
        if (clientIP.order != ipCounter) {
            clientIP.accessTimes++;
        }
    }
    
    // Log lines that is in time-range
    lastMinutesRecords = lastMinutesRecords.filter(x => !removed.includes(x));

    // Cache time-ranged log lines
    await cache(`last-${rangeMinutes}-minutes`, lastMinutesRecords);

    /**
     * @type {{ user: string, hasMultipleAccess: boolean, ips: string[], deActive: boolean }[]}
     */
    let result = [];

    // Check bad users
    for (let userName in users) {
        let ips = users[userName];
        let user = findUser(config, userName);
        if (!user) continue;

        // Check if user has multiple device access
        let hasMultipleAccess = Object.values(ips).filter(x => x.accessTimes > 1).length > (user.maxConnections ?? 3);

        result.push({
            user: userName,
            hasMultipleAccess,
            ips: Object.keys(ips).filter(ip => ips[ip].accessTimes > 1),
            deActive: !user.deActiveDate    // De-active user only if it's active
        });
    }

    // De-active users
    for (let user of result) {
        if (user.hasMultipleAccess && user.deActive) {
            showInfo(`De-active user ${user.user} due to multiple ip access (${user.ips.length} ips)`);
            setUserActive(config, /** All inbounds */ null, user.user, false, `Used by ${user.ips.length} ips in ${range} mins ago (${user.ips.join(', ')})`, env.BAD_USER_TAG ?? 'baduser');
            cron.isConfigChanged = true;
            cron.needRestartService = true;
        }
    }
    
    // Active users
    if (reActiveUsers) {
        let usersToActive = [];
        for (let inbound of config?.inbounds ?? []) {
            for (let user of inbound?.settings?.clients ?? []) {
                if (user.email && !!user.deActiveDate && user.deActiveReason?.includes('Used by ') && !result.find(x => x.hasMultipleAccess && x.user == user.email)) {
                    showInfo(`Re-active user "${user.email}" due to normal usage in inbound "${inbound.tag}"`);
                    usersToActive.push(user.email);
                    cron.isConfigChanged = true;
                    cron.needRestartService = true;
                    setUserActive(config, inbound.tag ?? null, user.email, true, undefined, env.BAD_USER_TAG ?? 'baduser');
                }
            }
        }
    }
}

module.exports = { cronBadUsers };