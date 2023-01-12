// @ts-check
const { execSync } = require("child_process");
const { getPaths, parseArgumentsAndOptions, readConfig, createLogger, cache } = require("./lib/util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 1, help = false}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronCommand() {

    if (help) {
        console.log(`V2Ray Cron Traffic help`);
        console.log(`Options :`);
        console.log(` --print               (only print result and dont make any changes, default: false)`);
        console.log(` --delay               (cron timer delay in minutes, default: 5)`);
        process.exit();
    }

    showInfo(`Start V2Rary Cron Traffic`);
    
    let {v2ray} = getPaths();

    /**
     * @type {TrafficUsages}
     */
    let trafficUsages = await cache('traffic-usage.json') ?? {};

    /**
     * @type {UserUsages}
     */
    let userUsage = await cache('usages') ?? {};

    let date = new Date().toLocaleDateString();

    try {
        let isNewDate = false;

        // Make Date
        if (!trafficUsages[date]) {
            trafficUsages[date] = [];
            isNewDate = true;
        }

        let stats = JSON.parse(execSync(`${v2ray} api stats -json -reset`).toString('utf-8'));

        // New Date (Ignore stats from last day)
        if (isNewDate)
        {
            stats.stat = [];
        }

        if (print)
            console.log(stats);

        // Stat items
        for (let item of stats.stat) {
            let {name: itemName, value} = item;
            if (!itemName || typeof itemName != 'string') continue;
            if (!itemName.includes('>>>')) continue;
            let [type, name, , direction] = itemName.split('>>>');

            let node = trafficUsages[date].find(x => x.type == type && x.name == name && x.direction == direction);

            if (!node) {
                node = { name, type, direction, traffic: 0 };
                trafficUsages[date].push(node);
            }

            node.traffic = node.traffic + Number(value ?? 0);

            // Update User usage
            if (type == 'user') {
                if (!userUsage[name]) userUsage[name] = {};
                let usage = userUsage[name];

                // Reset quota usage on month changes
                if (usage.quotaUsageUpdate && new Date(usage.quotaUsageUpdate).getMonth() != new Date().getMonth())
                    usage.quotaUsage = 0;

                // Update quota
                usage.quotaUsage = (usage.quotaUsage ?? 0) + Number(value ?? 0);
                usage.quotaUsageUpdate = new Date().toString();
            }
        }

        await cache('traffic-usage.json', trafficUsages);
        await cache('usages', userUsage);

    } catch (err) {
        showError(err);
    }

    showInfo('Complete.');

}

async function runCron() {
    showInfo(`Run traffic cron ${new Date().toLocaleString()}`);
    try {
        await cronCommand();
    } finally {
        if (delay > 0)
            setTimeout(runCron, delay * 60 * 1000);
    }
}

runCron();