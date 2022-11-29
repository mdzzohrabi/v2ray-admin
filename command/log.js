// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths } = require('../util');
const nReadLines = require('n-readlines');

async function log() {
    const { showError, showInfo, showOk } = createLogger();

    let {configPath, accessLogPath} = getPaths();
    let {
        cliArguments: [userName],
        cliOptions: { help }
    } = parseArgumentsAndOptions();

    
    if (help)
        return showInfo(`usage: node info [user] --protocol=vmess --tag=proxy`);

    showInfo(`V2Ray Log`);

    // 2022/10/14 01:57:05 171.22.27.137:52678 accepted tcp:app-measurement.com:443 [blocked] email: user18
    let file = new nReadLines(accessLogPath);

    /** @type {Buffer | boolean} */
    let buffer;

    let usages = {};

    while (buffer = file.next()) {
        let [date, time, clientAddress, status, destination, route, email, user] = buffer.toString('utf-8').split(' ');
        if (!user) continue;
        user = user.trim();
        let usage = usages[destination] = usages[destination] ?? { destination, users: [] };
        usage.users.push(user);
        let dateTime = new Date(date + ' ' + time);
        if (!usage.firstConnect || dateTime < usage.firstConnect)
            usage.firstConnect = dateTime;

        if (!usage.lastConnect || dateTime > usage.lastConnect)
            usage.lastConnect = dateTime;
    }

    console.table(usages);
}

log();