// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile, getUserConfig } = require('./util');
const qrCodeTerminal= require('qrcode-terminal');

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
    let {strClientConfig} = getUserConfig(user, protocol);
    showInfo(`User Config : ${strClientConfig}`);
    qrCodeTerminal.generate(strClientConfig, { small: true });
    let usages = await readLogFile(accessLogPath);
    let usage = user.email ? usages[user.email] : {};
    showInfo(`First Connect : ${usage?.firstConnect ? new Date(usage?.firstConnect).toLocaleString() : undefined}`);
    showInfo(`Last Connect : ${usage?.lastConnect ? new Date(usage?.lastConnect).toLocaleString() : undefined}`);
}

users();