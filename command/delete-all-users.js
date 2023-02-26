// @ts-check
const { parseArgumentsAndOptions, createLogger, cache, DateUtil, db, getPaths, getUserConfig, readConfig, writeConfig, log } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {
        pattern = '', tag = ''
    }
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

/**
 * Delete all users from specified inbound
 */
async function deleteAllUsersCommand() {

    let {configPath} = getPaths();
    let config = readConfig(configPath);
    let regex = pattern ? new RegExp(pattern) : null;

    for (let inbound of config?.inbounds ?? []) {
        if (!!tag && inbound.tag != tag) continue;
        if (inbound.settings && Array.isArray(inbound?.settings?.clients)) {
            inbound.settings.clients = inbound?.settings?.clients.filter(x => regex ? regex.test(x.email ?? '') : false);
        }
    }
    
    writeConfig(configPath, config);
    showInfo('Complete.');
}

deleteAllUsersCommand();