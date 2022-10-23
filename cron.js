// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines } = require("./util");

async function cronCommand() {

    const {
        cliArguments: [],
        cliOptions: {print}
    } = parseArgumentsAndOptions();

    let range = 1000 * 60 * 30; // 30 Minutes

    let {accessLogPath, configPath, errorLogPath} = getPaths();
    /**
     * @type {{ [user: string]: { [ip: string]: Date } }}
     */
    let users = {};
    let lines = readLogLines(accessLogPath);

    for await (let line of lines) {
        let {user, dateTime, clientAddress} = line;
        let clientIp = clientAddress.split(':')[0];
        users[user] = users[user] ?? {};
        users[user][clientIp] = dateTime;
    }

    let result = [];

    // Check bad users
    for (let user in users) {
        let ips = users[user];
        let dates = Object.values(ips);
        let hasMultipleAccess = false;
        for (let date of dates) {
            let found = dates.find(x => x != date && Math.abs(x.getTime() - date.getTime()) <= range);
            if (found) hasMultipleAccess = true;
        }
        result.push({
            user,
            hasMultipleAccess,
            ips: Object.keys(ips)
        });
    }

    if (print)
        console.table(result);

}

cronCommand();