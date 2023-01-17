// @ts-check
const { env } = require("process");
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser, setUserActive, writeConfig, createLogger, restartService, cache, log, readLogFile, DateUtil, findUsers } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 1, reactive = false, range = 1, disableexpired = true, expiredays = 30, help = false}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronCommand() {

    if (help) {
        console.log(`V2Ray Cron help`);
        console.log(`Options :`);
        console.log(` --print               (only print result and dont make any changes, default: false)`);
        console.log(` --delay               (cron timer delay in minutes, default: 1)`);
        console.log(` --reactive            (re-active bad-users, default: false)`);
        console.log(` --range               (minutes ago to look for multiple access for bad users, default: 1)`);
        console.log(` --disableexpired      (Disable expired users, default: true)`);
        console.log(` --expiredays          (Expire days, default: 30)`);
        process.exit();
        return;
    }

    showInfo(`Start V2Rary Cron`);
    showInfo(`Re-Activate Account: ${reactive ? 'Yes': 'No'}`);
    showInfo(`Disable expired accounts: ${disableexpired ? 'Yes': 'No'}`);
    showInfo(`Default Expire Days: ${expiredays ?? 30}`);
    showInfo(`Multiple IP Access Time Range (minutes): ${range} mins`);
    showInfo(`Delay Interval (minutes): ${delay} mins`);
    let fromDate = new Date();
    let rangeMinutes = range;
    fromDate.setMinutes(fromDate.getMinutes() - rangeMinutes);
    
    let {accessLogPath, configPath,} = getPaths();
    let config = readConfig(configPath);

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

    // Configuration
    let configBeforeUpdate = readConfig(configPath);
    // If true config must be write to disk
    let hasChange = false;
    // If true server service must be restart
    let isRestartService = false;

    // De-active users
    for (let user of result) {
        if (user.hasMultipleAccess && user.deActive) {
            showInfo(`De-active user ${user.user} due to multiple ip access (${user.ips.length} ips)`);
            setUserActive(configBeforeUpdate, /** All inbounds */ null, user.user, false, `Used by ${user.ips.length} ips in ${range} mins ago (${user.ips.join(', ')})`, env.BAD_USER_TAG ?? 'baduser');
            hasChange = true;
            isRestartService = true;
        }
    }
    
    // Active users
    if (reactive) {
        let usersToActive = [];
        for (let inbound of configBeforeUpdate?.inbounds ?? []) {
            for (let user of inbound?.settings?.clients ?? []) {
                if (user.email && !!user.deActiveDate && user.deActiveReason?.includes('Used by ') && !result.find(x => x.hasMultipleAccess && x.user == user.email)) {
                    showInfo(`Re-active user "${user.email}" due to normal usage in inbound "${inbound.tag}"`);
                    usersToActive.push(user.email);
                    hasChange = true;
                    isRestartService = true;
                    setUserActive(configBeforeUpdate, inbound.tag ?? null, user.email, true, undefined, env.BAD_USER_TAG ?? 'baduser');
                }
            }
        }
    }

    // Print Users with multiple access
    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

    let defaultExpireDays = expiredays;

    // Disable Expired Users
    if (disableexpired) {
        let usages = await readLogFile(accessLogPath);
        for (let inbound of configBeforeUpdate?.inbounds ?? []) {
            let users = inbound.settings?.clients ?? [];
            for (let user of users) {
                let expireDays = user?.expireDays ?? defaultExpireDays;
                let usage = usages[user?.email ?? ''];
                let strBillingStartDate = user?.billingStartDate ?? user?.firstConnect ?? usage?.firstConnect ?? user?.createDate;
                // Ignore user without any date
                if (!strBillingStartDate) continue;
                let billingStartDate = new Date(strBillingStartDate);
                let expireDate = DateUtil.addDays(billingStartDate, expireDays);

                if (user?.deActiveReason?.includes('Expired') == true || !billingStartDate || !user?.email)
                    continue;
                
                // Set user first connect
                if (!user.firstConnect && usage?.firstConnect) {
                    user.firstConnect = String(usage.firstConnect) ?? user.firstConnect;
                    hasChange = true;
                }

                // Set billing start date
                if (!user.billingStartDate && billingStartDate) {
                    user.billingStartDate = billingStartDate?.toString();
                    hasChange = true;
                }

                // User expired
                if (expireDate && expireDate?.getTime() < Date.now()) {
                    hasChange = true;
                    isRestartService = true;
                    user.expiredDate = String(new Date());
                    setUserActive(configBeforeUpdate, inbound.tag ?? null, user?.email, false, `Expired after "${expireDays}" days`, env.EXPIRED_USER_TAG ?? 'baduser');
                    showInfo(`De-active user "${user?.email}" due to expiration at "${expireDate}" after "${expireDays}" days from "${billingStartDate}"`);
                }
                // Quota limit
                else if (user.quotaLimit && usage?.quotaUsage && usage?.quotaUsage > user.quotaLimit) {
                    hasChange = true;
                    isRestartService = true;
                    setUserActive(configBeforeUpdate, inbound.tag ?? null, user?.email, false, `Bandwith used`, env.QUOTA_USER_TAG ?? 'baduser');
                    showInfo(`De-active user "${user?.email}" due to bandwidth usage`);
                }
            }
        }
    }

    // Save Configuration and restart service
    if (hasChange && !print) {
        showInfo(`Save configuration changes`);
        await writeConfig(configPath, configBeforeUpdate);
        if (isRestartService) {
            showInfo(`Restart V2Ray service`);
            restartService().catch(console.error);
        }
    }

    showInfo('Complete.');

}

async function runCron() {
    showInfo(`Run cron ${new Date().toLocaleString()}`);
    try {
        await cronCommand();
    } finally {
        if (delay > 0)
            setTimeout(runCron, delay * 60 * 1000);
    }
}

runCron();