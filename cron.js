// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser, setUserActive, writeConfig, createLogger, restartService, cache,  } = require("./util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 5, reactive = true}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronCommand() {    
    let fromDate = new Date();
    let rangeMinutes = 30;
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
        if (dateTime < fromDate) {
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
        let hasMultipleAccess = Object.values(ips).length > (user['maxConnections'] ?? 2);
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
            setUserActive(configBeforeUpdate, user.user, false, `Used by ${user.ips.length} ips`);
            hasChange = true;
        }
    }
    
    // Active users
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

    if (hasChange && !print) {
        await writeConfig(configPath, configBeforeUpdate);
        restartService().catch(console.error);
    }

    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

    showInfo('Complete.')

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