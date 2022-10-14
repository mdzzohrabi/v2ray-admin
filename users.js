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
        cliOptions: { protocol = 'vmess', tag, help }
    } = parseArgumentsAndOptions();

    
    if (help)
        return showInfo(`usage: node users --protocol=vmess --tag=proxy`);

    showInfo(`V2Ray Users`);

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return showError('No inbounds defined in configuration');

    let inbounds = config.inbounds?.filter(x => x.protocol == protocol && (!tag || x.tag == tag)) ?? [];

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


    for (let inbound of inbounds) {
        showInfo(`Users of protocol "${inbound.protocol}"${inbound.tag ? `, Tag: ${inbound.tag}` : ''}`);
        let users = inbound.settings?.clients ?? [];
        for (let user of users) {
            let usage = usages[user.email];
            user['firstConnect'] = usage?.firstConnect;
            user['lastConnect'] = usage?.lastConnect;
        }
        console.table(users);
    }
}

users();