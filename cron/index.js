// @ts-check
const { env } = require("process");
const { parseArgumentsAndOptions, createLogger, restartService } = require("../lib/util");
const { cronBadUsers } = require("./cron-bad-users");
const { cronDailyUsage } = require("./cron-daily-usage");
const { cronExpiredUsers } = require("./cron-expired-users");
const { cronTrafficUsage } = require("./cron-traffic-usage");

const {
    cliArguments: [],
    cliOptions: {
        print = false,
        delay = 5,
        reactive: reActive = false,
        range = 1,
        disableExpired = true,
        expireDays = 30,
        timeout = 5,
        help = false
    }
} = parseArgumentsAndOptions();

let { showInfo, showError, showWarn } = createLogger();

/**
 * @typedef {{
 *      needRestartService: boolean
 * }} CronContext
 */

    
if (help) {
    console.log(`Cron help`);
    console.log(`Options :`);
    console.log(` --print               (only print result and dont make any changes, default: false)`);
    console.log(` --delay               (cron timer delay in minutes, default: 1)`);
    console.log(` --reactive            (re-active bad-users, default: false)`);
    console.log(` --range               (minutes ago to look for multiple access for bad users, default: 1)`);
    console.log(` --disable-expired     (Disable expired users, default: true)`);
    console.log(` --expire-days         (Expire days, default: 30)`);
    console.log(` --timeout             (Cron jobs timeout, default: 5 mins)`);
    process.exit();
}

showInfo(`Re-Activate Account: ${reActive ? 'Yes' : 'No'}`);
showInfo(`Disable expired accounts: ${disableExpired ? 'Yes' : 'No'}`);
showInfo(`Default Expire Days: ${expireDays ?? 30}`);
showInfo(`Multiple IP Access Time Range (minutes): ${range} mins`);
showInfo(`Delay Interval (minutes): ${delay} mins`);
showInfo(`Jobs Timeout (minutes): ${timeout} mins`);

/**
 * @param {any} error Error
 */
function catchError(error) {
    console.error(error);
}

async function startCronJob() {
    showInfo(`---------------------`);
    showInfo(`Start CronJob on ${new Date().toLocaleString()}`);

    /** @type {CronContext} */
    let cron = {
        needRestartService: false
    }

    let jobs = [
        // Cron Bad Users
        () => cronBadUsers(cron, range, reActive).catch(catchError),

        // Cron Expired Users
        () => cronExpiredUsers(cron, expireDays).catch(catchError),

        // Cron Daily Usage
        () => cronDailyUsage(cron).catch(catchError),

        // Cron Traffic Usage
        () => cronTrafficUsage(cron).catch(catchError)
    ];

    let allJobs = new Promise(async (done, reject) => {
        let ignoreJobs = setTimeout(() => {
            showWarn(`Jobs not completed after ${timeout} mins and jobs is ignored`);
            reject(new Error(`Cron jobs time out after ${timeout} mins`));
        }, timeout * 60 * 1000);

        // Sequential execute jobs
        for (let job of jobs) {
            await job();
        }

        clearTimeout(ignoreJobs);
        done(true);
    });

    // Long process checking
    let longProcess = setTimeout(() => {
        showWarn(`Processing jobs is longer than expected, it will ignore after ${timeout} mins if not completed (Not completed after 30s)`);
    }, 30_000);

    allJobs.then(() => {
        clearTimeout(longProcess);
    });

    allJobs.catch(() => {
        clearTimeout(longProcess);
    });

    await allJobs;
    
    // Restart V2Ray service
    if (cron.needRestartService) {
        showInfo(`Restart V2Ray service`);
        restartService().catch(console.error);
    }

    showInfo('CronJob Complete');
}

process.on('uncaughtException', err => {
    showError(err);
})

async function runCron() {  
    try {
        await startCronJob();
    }
    catch (err) {
        showError(err?.message);
    }
    finally {
        if (delay > 0)
            setTimeout(runCron, delay * 60 * 1000);
    }
}

runCron();