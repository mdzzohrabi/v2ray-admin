// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, addUser, getUserConfig } = require('../lib/util');
const qrCode = require('qrcode-terminal');

async function addUserCommand() {
    const { showError, showInfo, showOk } = createLogger();

    let {configPath} = getPaths();
    let {
        cliArguments: [ email ],
        cliOptions: { protocol = 'vmess', tag }
    } = parseArgumentsAndOptions();


    try {
        let user = await addUser(configPath, email, protocol, tag);
        let {strClientConfig} = getUserConfig(user, protocol);

        showOk(`User added successful`);
        showInfo(`User ID : ${user.id}`);
        showInfo(`Client Config : ${strClientConfig}`);
        qrCode.generate(strClientConfig, { small: true });
    } catch (err) {
        showError(err.message);
    }
}

addUserCommand();