// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig } = require('./util');
const { randomUUID } = require('crypto');
const { env } = require('process');
const { open } = require('fs/promises');
const { resolve } = require('path');
const nReadLines = require('n-readlines');

async function users() {
    const { showError, showInfo, showOk } = createLogger();

    let {configPath, accessLogPath} = getPaths();
    let {
        cliArguments: [userName],
        cliOptions: { protocol = 'vmess', tag, help }
    } = parseArgumentsAndOptions();

    
    if (help)
        return showInfo(`usage: node info [user] --protocol=vmess --tag=proxy`);

    showInfo(`V2Ray User`);

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return showError('No inbounds defined in configuration');

    let inbounds = config.inbounds?.filter(x => x.protocol == protocol && (!tag || x.tag == tag)) ?? [];

    let user = inbounds.pop()?.settings?.clients?.find(x => x.email == userName);

    if (!user)
        return showError(`User not found`);

    showInfo(`User : ${user.email}`);
    showInfo(`User ID : ${user.id}`);
    showInfo(`User Level : ${user.level}`);

    let clientConfig = {"add":"171.22.27.137","aid":"0","host":"","id":user.id,"net":"ws","path":"","port":"10808","ps":"VIP-" + user.email,"scy":"chacha20-poly1305","sni":"","tls":"","type":"","v":"2"}

    showInfo(`User Config : ${protocol}://${Buffer.from(JSON.stringify(clientConfig)).toString('base64')}`);

    // 2022/10/14 01:57:05 171.22.27.137:52678 accepted tcp:app-measurement.com:443 [blocked] email: user18
    let file = new nReadLines(accessLogPath);

    /** @type {Buffer | boolean} */
    let buffer;

    let usages = {};

    while (buffer = file.next()) {
        let [date, time, clientAddress, status, destination, route, email, user] = buffer.toString('utf-8').split(' ');
        if (!user) continue;
        user = user.trim();
        let usage = usages[user] = usages[user] ?? {};
        let dateTime = new Date(date + ' ' + time);
        if (!usage.firstConnect || dateTime < usage.firstConnect)
            usage.firstConnect = dateTime;

        if (!usage.lastConnect || dateTime > usage.lastConnect)
            usage.lastConnect = dateTime;
    }

    let usage = usages[user.email];

    showInfo(`First Connect : ${usage?.firstConnect}`);
    showInfo(`Last Connect : ${usage?.lastConnect}`);
}

users();