// @ts-check
const { env } = require("process");
const { getPaths, parseArgumentsAndOptions, readLogLines, readConfig, findUser, setUserActive, writeConfig, createLogger, restartService, cache, log, readLogFile, DateUtil, findUsers } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 1, reactive = false, range = 1, disableexpired = true, expiredays = 30, help = false}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

/**
 * @typedef {{
 *      config: V2RayConfig
 *      needRestartService: boolean
 *      isConfigChanged: boolean
 * }} CronContext
 */

async function cronCommand() {

    if (help) {
        console.log(`V2Ray Cron help`);
        console.log(`Options :`);
        console.log(` --print               (only print result and dont make any changes, default: false)`);
        console.log(` --delay               (cron timer delay in minutes, default: 1)`);
        console.log(` --reactive            (re-active bad-users, default: false)`);
        console.log(` --range               (minutes ago to look for multiple access for bad users, default: 1)`);
        console.log(` --disableexpired      (Disable expired users, default: true)`);
        console.log(` --expiredays          (Expire days, default: 30)`);
        process.exit();
        return;
    }

    showInfo(`Start V2Rary Cron`);
    showInfo(`Re-Activate Account: ${reactive ? 'Yes': 'No'}`);
    showInfo(`Disable expired accounts: ${disableexpired ? 'Yes': 'No'}`);
    showInfo(`Default Expire Days: ${expiredays ?? 30}`);
    showInfo(`Multiple IP Access Time Range (minutes): ${range} mins`);
    showInfo(`Delay Interval (minutes): ${delay} mins`);
    
    // Cron Bad Users

    // Print Users with multiple access
    if (print)
        console.table(result.filter(x => x.hasMultipleAccess));

    // Cron Expired Users

    // Save Configuration and restart service
    if (hasChange && !print) {
        showInfo(`Save configuration changes`);
        await writeConfig(configPath, configBeforeUpdate);
        if (isRestartService) {
            showInfo(`Restart V2Ray service`);
            restartService().catch(console.error);
        }
    }

    showInfo('Complete.');

}

async function runCron() {
    showInfo(`Run cron ${new Date().toLocaleString()}`);
    try {
        await cronCommand();
    } finally {
        if (delay > 0)
            setTimeout(runCron, delay * 60 * 1000);
    }
}

runCron();