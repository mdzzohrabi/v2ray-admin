// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig } = require('./util');
const { randomUUID } = require('crypto');
const { env } = require('process');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

function addUser() {
    const { showError, showInfo, showOk } = createLogger();

    let {configPath} = getPaths();
    let {
        cliArguments: [ email ],
        cliOptions: { protocol = 'vmess', tag }
    } = parseArgumentsAndOptions();

    
    if (String(email ?? '').length == 0)
        return showInfo(`usage: node add-user [email] --protocol=vmess --tag=proxy`);

    showInfo(`Add user "${email}" for protocol "${protocol}"${tag ? ` with tagged [${tag}]` : ''}`);

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return showError('No inbounds defined in configuration');

    let inbound = config.inbounds?.find(x => x.protocol == protocol && (!tag || x.tag == tag));

    if (!inbound)
        return showError(`No inbound found for protocol "${protocol}"`);

    let id = randomUUID();

    let user = { id, email, level: 0 };
    let users = inbound.settings?.clients ?? [];

    if (!Array.isArray(users))
        return showError(`settings.clients is not in valid format for protocol "${protocol}"`);

    users.push(user);

    // Add Clients
    if (!inbound.settings) inbound.settings = {};
    inbound.settings.clients = users;

    // Write config
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    showOk(`User added successful`);
    showInfo(`User ID : ${id}`);
}

addUser();