// @ts-check
const { parseArgumentsAndOptions, createLogger, cache, DateUtil, db, getPaths, getUserConfig, readConfig, writeConfig, log } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

/**
 * Update user monthly bandwidth usage
 */
async function updateBadUsersCommand() {

    let {configPath} = getPaths();
    let config = readConfig(configPath);

    let users = config?.inbounds?.flatMap(x => x.settings?.clients ?? []).filter(x => !!x.deActiveDate);

    let badRule = config?.routing?.rules?.find(x => x.outboundTag == 'baduser');

    if (badRule) {
        log(`Update bad users rule`)
        badRule.user = users?.map(x => x.email ?? '') ?? [];
        writeConfig(configPath, config);
    }

    showInfo('Complete.');
}

updateBadUsersCommand();