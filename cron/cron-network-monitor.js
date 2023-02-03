// @ts-check
const { execSync } = require("child_process");
const { getPaths, parseArgumentsAndOptions, readConfig, createLogger, cache, db, log } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 1, help = false}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronNetworkMonitor() {

    if (help) {
        console.log(`Cron Network Monitoring`);
        console.log(`Options :`);
        console.log(` --print               (only print result and dont make any changes, default: false)`);
        console.log(` --url                 (Url to test network)`);
        console.log(` --delay               (cron timer delay in minutes, default: 15)`);
        process.exit();
    }

    showInfo(`Start V2Rary Network Monitoring`);

    showInfo('Complete.');
}

async function runNetworkMonitorCron() {
    showInfo(`Run network monitor test on ${new Date().toLocaleString()}`);
    try {
        await cronNetworkMonitor();
    } finally {
        if (delay > 0)
            setTimeout(runNetworkMonitorCron, delay * 60 * 1000);
    }
}

runNetworkMonitorCron();