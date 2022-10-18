// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile } = require('./util');
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

    let clientConfig = {"add":"171.22.27.137","aid":"0","host":"","id":user.id,"net":"ws","path":"","port":"10808","ps":"VIP-" + user.email,"scy":"chacha20-poly1305","sni":"","tls":"","type":"","v":"2"}
    let strClientConfig = `${protocol}://${Buffer.from(JSON.stringify(clientConfig)).toString('base64')}`;

    showInfo(`User Config : ${strClientConfig}`);
    qrCodeTerminal.generate(strClientConfig, { small: true });
    // let qrCodeUrl = await qrCode.toString(strClientConfig);
    // showInfo(`QR Code : ${qrCodeUrl}`);
    let usages = await readLogFile(accessLogPath);
    let usage = user.email ? usages[user.email] : {};

    showInfo(`First Connect : ${usage?.firstConnect?.toLocaleString()}`);
    showInfo(`Last Connect : ${usage?.lastConnect?.toLocaleString()}`);
}

users();