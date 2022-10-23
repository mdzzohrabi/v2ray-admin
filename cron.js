// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser } = require("./util");

async function cronCommand() {

    const {
        cliArguments: [],
        cliOptions: {print}
    } = parseArgumentsAndOptions();

    
    let fromDate = new Date('2022/10/23 15:15:20');
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
        if (!user) continue;
        let hasMultipleAccess = Object.values(ips).length > (user['maxConnections'] ?? 1);
        result.push({
            user: userName,
            hasMultipleAccess,
            ips: Object.keys(ips)
        });
    }

    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

}

cronCommand();