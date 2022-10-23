// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser, setUserActive, writeConfig, createLogger, restartService } = require("./util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 5}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronCommand() {    
    let fromDate = new Date();
    fromDate.setMinutes(fromDate.getMinutes() - 30);
    
    let {accessLogPath, configPath,} = getPaths();
    let config = readConfig(configPath);

    /**
     * @type {{ [user: string]: { [ip: string]: Date } }}
     */
    let users = {};
    let lines = readLogLines(accessLogPath);

    for await (let line of lines) {
        let {user, dateTime, clientAddress,status} = line;
        if (status != 'accepted') continue;
        if (dateTime < fromDate) continue;
        let splits = clientAddress.split(':');
        let clientIp = splits[splits.length - 2];
        users[user] = users[user] ?? {};
        users[user][clientIp] = dateTime;
    }

    /**
     * @type {{ user: string, hasMultipleAccess: boolean, ips: string[] }[]}
     */
    let result = [];

    // Check bad users
    for (let userName in users) {
        let ips = users[userName];
        let user = findUser(config, userName);
        if (!user || !!user.deActiveDate) continue;
        let hasMultipleAccess = Object.values(ips).length > (user['maxConnections'] ?? 2);
        result.push({
            user: userName,
            hasMultipleAccess,
            ips: Object.keys(ips)
        });
    }

    let configBeforeUpdate = readConfig(configPath);
    let hasChange = false;
    for (let user of result) {
        if (user.hasMultipleAccess) {
            showInfo(`De-active user ${user.user} due to multiple ip access (${user.ips.length} ips)`);
            setUserActive(configBeforeUpdate, user.user, false, `Used by ${user.ips.length} ips`);
            hasChange = true;
        }
    }
    if (hasChange && !print) {
        await writeConfig(configPath, configBeforeUpdate);
        restartService().catch(console.error);
    }

    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

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