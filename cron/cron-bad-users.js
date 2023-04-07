// @ts-check
const { env } = require("process");
const { getPaths, readLogLines, cache, findUser, setUserActive, createLogger, readConfig, writeConfig, db, serverNodeRequest } = require("../lib/util");

/**
 * Cron Bad Users
 * @param {import("./index").CronContext} cron Cron context
 */
async function cronBadUsers(cron, range = 1, reActiveUsers = true) {
    let { showInfo, showError } = createLogger('[Bad-Users]');

    showInfo(`Start`)

    let fromDate = new Date('2023/03/29 15:54:05');
    let rangeMinutes = range;
    fromDate.setMinutes(fromDate.getMinutes() - rangeMinutes);
    
    let { accessLogPath, configPath } = getPaths();

    /**
     * @type {{ [user: string]: { [ip: string]: { order: number, lastAccessDate: Date, accessTimes: number } } }}
     */
    let users = {};
    let lines = readLogLines(accessLogPath, `last-${rangeMinutes}-minutes-bytes`);

    /** @type {AsyncGeneratorType<ReturnType<typeof readLogLines>>[]} */
    let lastMinutesRecords = await cache(`last-${rangeMinutes}-minutes`) ?? [];

    // Read log lines
    for await (let line of lines) {
        let {dateTime, status} = line;
        if (status != 'accepted') continue;
        if (dateTime < fromDate) continue;
        lastMinutesRecords.push(line);
    }

    // Grab from remote nodes
    /** @type {ServerNode[]} */
    const serverNodes = await db('server-nodes') ?? [];

    const serverNodesLogReaderPromises = serverNodes.map(async node => {
        try {
            // Skip
            if (node.disabled === true || node.readLastMinutesLogs !== true) return;

            /** @type {AsyncGeneratorType<ReturnType<typeof readLogLines>>[]} */
            let nodeLogs = await serverNodeRequest(node, '/api/last_log_records?m=' + rangeMinutes, 'get', undefined, 5000);

            if (Array.isArray(nodeLogs)) {
                nodeLogs.forEach(item => lastMinutesRecords.push(item));
                return true;
            }

            return false;
        } catch (err) {
            showError(err?.message);
            return false;
        }
    });

    // Wait for all servers to respond
    await Promise.allSettled(serverNodesLogReaderPromises);
    
    // Sort by dateTiem
    lastMinutesRecords = lastMinutesRecords.sort((a, b) => a.dateTime == b.dateTime ? 0 : new Date(a.dateTime) < new Date(b.dateTime) ? -1 : 1);
    
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
        let clientIps = users[user] = (users[user] ?? {});
        let ipCounter = Object.values(clientIps).length;
        let clientIP = clientIps[clientIpAddress] = (clientIps[clientIpAddress] ?? { order: ipCounter, accessTimes: 1 });
        clientIP.lastAccessDate = dateTime;
        // clientIP.lastAccessDate2 = new Date(dateTime).toLocaleString();
        if (clientIP.order != ipCounter) {
            clientIP.accessTimes++;
        }
    }
    
    // Log lines that is in time-range
    lastMinutesRecords = lastMinutesRecords.filter(x => !removed.includes(x));
    
    // Cache time-ranged log lines
    await cache(`last-${rangeMinutes}-minutes`, lastMinutesRecords);

    /**
     * @type {{ user: string, hasMultipleAccess: boolean, ips: string[], deActive: boolean, maxConnections: number }[]}
     */
    let result = [];

    let config = readConfig(configPath);
    let isConfigChanged = false;

    // Check bad users
    for (let userName in users) {
        let ips = users[userName];
        let user = findUser(config, userName);
        if (!user) continue;

        // Check if user has multiple device access
        let hasMultipleAccess = Object.values(ips).filter(x => x.accessTimes > 1).length > (user.maxConnections ?? 3);

        result.push({
            user: userName,
            maxConnections: user.maxConnections ?? 3,
            hasMultipleAccess,
            ips: Object.keys(ips).filter(ip => ips[ip].accessTimes > 1),
            deActive: hasMultipleAccess && !user.deActiveDate    // De-active user only if it's active
        });
    }

    let hasDeActiveUser = false;
    // De-active users
    for (let user of result) {
        if (user.hasMultipleAccess && user.deActive) {
            showInfo(`De-active user ${user.user} due to multiple ip access (${user.ips.length}/${user.maxConnections} ips)`);
            setUserActive(config, /** All inbounds */ null, user.user, false, `Used by ${user.ips.length}/${user.maxConnections} ips in ${range} mins ago (${user.ips.join(', ')})`, env.BAD_USER_TAG ?? 'baduser');
            isConfigChanged = true;
            hasDeActiveUser = true;
        }
    }

    if (hasDeActiveUser) {
        showInfo(`Request restart service due to de-activated users`);
        cron.needRestartService = true;
    }
    
    // Active users
    if (reActiveUsers) {
        let usersToActive = [];
        for (let inbound of config?.inbounds ?? []) {
            for (let user of inbound?.settings?.clients ?? []) {
                if (user.email && !!user.deActiveDate && user.deActiveReason?.includes('Used by ') && !result.find(x => x.hasMultipleAccess && x.user == user.email)) {
                    showInfo(`Re-active user "${user.email}" due to normal usage in inbound "${inbound.tag}"`);
                    usersToActive.push(user.email);
                    isConfigChanged = true;
                    cron.needRestartService = true;
                    showInfo(`Request restart service due to activated users`);
                    setUserActive(config, inbound.tag ?? null, user.email, true, undefined, env.BAD_USER_TAG ?? 'baduser');
                }
            }
        }
    }

    if (isConfigChanged)
        writeConfig(configPath, config);

    showInfo(`Complete`);
    process.exit(0);
}

module.exports = { cronBadUsers };