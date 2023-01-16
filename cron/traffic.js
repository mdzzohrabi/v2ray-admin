// @ts-check
const { execSync } = require("child_process");
const { getPaths, parseArgumentsAndOptions, readConfig, createLogger, cache, db } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {print = false, delay = 1, help = false}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function cronTrafficCommand() {

    if (help) {
        console.log(`V2Ray Cron Traffic help`);
        console.log(`Options :`);
        console.log(` --print               (only print result and dont make any changes, default: false)`);
        console.log(` --delay               (cron timer delay in minutes, default: 1)`);
        process.exit();
    }

    showInfo(`Start V2Rary Cron Traffic`);
    
    let {v2ray} = getPaths();

    /**
     * @type {TrafficUsages}
     */
    let trafficUsages = await db('traffic-usages') ?? {};

    /**
     * @type {UserUsages}
     */
    let userUsage = await db('user-usages') ?? {};

    let date = new Date().toLocaleDateString();

    try {
        let isNewDate = false;

        // Make Date
        if (!trafficUsages[date]) {
            trafficUsages[date] = [];
            isNewDate = true;
        }

        let stats = JSON.parse(execSync(`${v2ray} api stats -json -reset`).toString('utf-8'));
        let intl = new Intl.DateTimeFormat('fa-IR', { month: 'numeric' });

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
                if (usage.quotaUsageUpdate && intl.format(new Date(usage.quotaUsageUpdate)) != intl.format(new Date())) {
                    showInfo(`Reset Quota usage for user "${name}" on date "${new Date()}"`)
                    usage.quotaUsage = 0;
                }

                // Update quota
                usage.quotaUsage = (usage.quotaUsage ?? 0) + Number(value ?? 0);
                usage.quotaUsageUpdate = new Date().toString();
            }
        }

        await db('traffic-usages', trafficUsages);
        await db('user-usages', userUsage);

    } catch (err) {
        showError(err);
    }

    showInfo('Complete.');

}

async function runCron() {
    showInfo(`Run traffic cron ${new Date().toLocaleString()}`);
    try {
        await cronTrafficCommand();
    } finally {
        if (delay > 0)
            setTimeout(runCron, delay * 60 * 1000);
    }
}

runCron();