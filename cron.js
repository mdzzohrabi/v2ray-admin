// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser, setUserActive, writeConfig, createLogger } = require("./util");

async function cronCommand() {

    const {
        cliArguments: [],
        cliOptions: {print}
    } = parseArgumentsAndOptions();

    let {showInfo, showError, showWarn} = createLogger();

    
    let fromDate = new Date('2022/10/15 21:31:36');
    fromDate.setMinutes(fromDate.getMinutes() - 3000000);
    
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
        let hasMultipleAccess = Object.values(ips).length > (user['maxConnections'] ?? 1);
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
            setUserActive(configBeforeUpdate, user.user, false);
            hasChange = true;
        }
    }
    if (hasChange)
        await writeConfig(configPath, configBeforeUpdate);

    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

}

cronCommand();