// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser, setUserActive, writeConfig, createLogger, restartService, cache, log, readLogFile,  } = require("./util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 5, reactive = true, range = 10, disableexpired = true, expiredays = 30, help = false}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronCommand() {

    if (help) {
        console.log(`V2Ray Cron help`);
        console.log(`Options :`);
        console.log(` --print               (only print result and dont make any changes, default: false)`);
        console.log(` --delay               (cron timer delay in minutes, default: 5)`);
        console.log(` --reactive            (re-active bad-users, default: true)`);
        console.log(` --range               (minutes ago to look for multiple access for bad users, default: 10)`);
        console.log(` --disableexpired      (Disable expired users, default: true)`);
        console.log(` --expiredays          (Expire days, default: 30)`);
        process.exit();
        return;
    }

    showInfo(`Start V2Rary Cron`);
    showInfo(`Re-Activate Account: ${reactive ? 'Yes': 'No'}`);
    showInfo(`Disable expired accounts: ${disableexpired ? 'Yes': 'No'}`);
    showInfo(`Expire Days: ${expiredays ?? 30}`);
    let fromDate = new Date();
    let rangeMinutes = range;
    fromDate.setMinutes(fromDate.getMinutes() - rangeMinutes);
    
    let {accessLogPath, configPath,} = getPaths();
    let config = readConfig(configPath);

    /**
     * @type {{ [user: string]: { [ip: string]: Date } }}
     */
    let users = {};
    let lines = readLogLines(accessLogPath, `last-${rangeMinutes}-minutes-bytes`);
    let lastMinutesRecords = await cache(`last-${rangeMinutes}-minutes`) ?? [];

    for await (let line of lines) {
        let {dateTime, status} = line;
        if (status != 'accepted') continue;
        if (dateTime < fromDate) continue;
        lastMinutesRecords.push(line);
    }
    let removed = [];
    for (let line of lastMinutesRecords) {
        let {clientAddress, user, dateTime} = line;
        if (new Date(dateTime) < fromDate) {
            removed.push(line);
            continue;
        }
        let splits = clientAddress.split(':');
        let clientIp = splits[splits.length - 2];
        users[user] = users[user] ?? {};
        users[user][clientIp] = dateTime;
    }
    
    lastMinutesRecords = lastMinutesRecords.filter(x => !removed.includes(x));
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
        let hasMultipleAccess = Object.values(ips).length > (user['maxConnections'] ?? 3);
        result.push({
            user: userName,
            hasMultipleAccess,
            ips: Object.keys(ips),
            deActive: !user.deActiveDate
        });
    }

    let configBeforeUpdate = readConfig(configPath);
    let hasChange = false;

    // De-active users
    for (let user of result) {
        if (user.hasMultipleAccess && user.deActive) {
            showInfo(`De-active user ${user.user} due to multiple ip access (${user.ips.length} ips)`);
            setUserActive(configBeforeUpdate, user.user, false, `Used by ${user.ips.length} ips in ${range} mins ago (${user.ips.join(', ')})`);
            hasChange = true;
        }
    }
    
    // Active users
    if (reactive) {
        let usersToActive = [];
        for (let inbound of configBeforeUpdate?.inbounds ?? []) {
            for (let user of inbound?.settings?.clients ?? []) {
                if (!!user.deActiveDate && user.deActiveReason?.includes('Used by ') && !result.find(x => x.hasMultipleAccess && x.user == user.email)) {
                    showInfo(`Re-active user ${user.email} due to normal usage`);
                    usersToActive.push(user.email);
                    hasChange = true;
                }
            }
        }

        for (let user of usersToActive)
            setUserActive(configBeforeUpdate, user ?? '', true);
    }

    // Print Users with multiple access
    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

    let defaultExpireDays = expiredays;

    // Disable Expired Users
    if (disableexpired) {
        let usages = await readLogFile(accessLogPath);
        let users = configBeforeUpdate?.inbounds?.flatMap(x => x.settings?.clients) ?? [];
        for (let user of users) {
            let expireDays = user?.expireDays ?? defaultExpireDays;
            let usage = usages[user?.email ?? ''];
            if (!usage?.firstConnect || !!user?.deActiveDate || !user?.email)
                continue;
            if (!user.firstConnect)
                user.firstConnect = String(usage.firstConnect) ?? user.firstConnect;
            let diffTime = Date.now() - new Date(user.billingStartDate ?? usage.firstConnect).getTime();
            if (diffTime/(1000*60*60*24) > expireDays) {
                // User expired
                hasChange = true;
                user.expiredDate = String(new Date());
                setUserActive(configBeforeUpdate, user?.email, false, `Expired after ${expireDays} days`);
                showInfo(`De-active user "${user?.email}" due to expiration after ${expireDays} days`);
            }
        }
    }

    // Save Configuration and restart service
    if (hasChange && !print) {
        showInfo(`Save configuration changes`);
        await writeConfig(configPath, configBeforeUpdate);
        restartService().catch(console.error);
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