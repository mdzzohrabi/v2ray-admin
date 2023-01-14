// @ts-check
const { parseArgumentsAndOptions, createLogger, cache, DateUtil } = require("../lib/util");

const {
    cliArguments: [],
    cliOptions: {}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

/**
 * Update user monthly bandwidth usage
 */
async function updateUsersMonthTrafficCommand() {

    /**
     * @type {TrafficUsages}
     */
    let trafficUsages = await cache('traffic-usage.json') ?? {};

    /**
     * @type {UserUsages}
     */
    let userUsage = await cache('usages') ?? {};

    /** @type {string[]} */
    let reseted = [];

    let now = new Date();

    for (let date in trafficUsages) {
        if (!DateUtil.isSameJMonth(now, new Date(date)))
            continue;
        for (let usage of trafficUsages[date]) {
            if (usage.type == 'user') {
                let userName = usage.name;
                if (!userUsage[userName]) {
                    userUsage[userName] = { quotaUsage: 0 };
                }
                if (!reseted.includes(userName)) {
                    userUsage[userName].quotaUsage = 0;
                    userUsage[userName].quotaUsageUpdate = new Date().toString();
                    reseted.push(userName);
                }
                // Update user traffic
                userUsage[userName].quotaUsage = (userUsage[userName].quotaUsage ?? 0) + usage.traffic;
            }
        }
    }

    // Save usages
    await cache('usages', userUsage);

    showInfo('Complete.');
}

updateUsersMonthTrafficCommand();