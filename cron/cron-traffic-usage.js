// @ts-check
const { execSync, exec } = require("child_process");
const { getPaths, createLogger, db, log } = require("../lib/util");

/**
 * Exec async
 * @param {string} command Command
 * @returns {Promise<string>}
 */
async function execAsync(command) {
    return new Promise((done, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) reject(err);
            done(stdout ?? stderr);
        });
    })
}

/**
 * Cron Traffic Usage
 * @param {import("./index").CronContext} cron Cron context
*/
async function cronTrafficUsage(cron) {
    
    let {showInfo, showError} = createLogger('[Traffic-Usage]');

    showInfo(`Start`);
    
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

        let stats = JSON.parse(await execAsync(`${v2ray} api stats -json -reset`));
        let intl = new Intl.DateTimeFormat('fa-IR', { month: 'numeric' });

        // New Date (Ignore stats from last day)
        if (isNewDate)
        {
            stats.stat = [];
        }

        // if (print)
        //     console.log(stats);

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
                    usage.quotaUsage_local = 0;
                }

                // Update quota
                usage.quotaUsage_local = (usage.quotaUsage ?? 0) + Number(value ?? 0);
                usage.quotaUsage = Object.keys(usage).filter(x => x.startsWith('quotaUsage_')).map(x => usage[x]).reduce((s, v) => s + v, 0);
                usage.quotaUsageUpdate = new Date().toString();
            }
        }

        await db('traffic-usages', trafficUsages);
        await db('user-usages', userUsage);
        showInfo(`Complete`)

    } catch (err) {
        log(`Error during traffic update : ${err.message}`);
        showError(err);
    }
}

module.exports = { cronTrafficUsage };