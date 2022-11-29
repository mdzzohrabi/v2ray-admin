// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile } = require('../util');

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
    let usages = await readLogFile(accessLogPath);

    for (let inbound of inbounds) {
        showInfo(`Users of protocol "${inbound.protocol}"${inbound.tag ? `, Tag: ${inbound.tag}` : ''}`);
        let users = inbound.settings?.clients ?? [];
        for (let user of users) {
            let usage = user.email ? usages[user.email] : {};
            user['firstConnect'] = usage?.firstConnect ? new Date(usage?.firstConnect).toLocaleString() : undefined;
            user['lastConnect'] = usage?.lastConnect ? new Date(usage?.lastConnect).toLocaleString() : undefined;
        }
        console.table(users);
    }
}

users();