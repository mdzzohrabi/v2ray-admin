// @ts-check

const { env } = require("process");
const { getPaths, readLogFile, DateUtil, setUserActive, createLogger, readConfig, writeConfig } = require("../lib/util");

/**
 * De-active expired users
 * @param {import("./index").CronContext} cron Cron context
 * @param {number} defaultExpireDays Expire days
 * @returns 
 */
async function cronExpiredUsers(cron, defaultExpireDays) {
    let { accessLogPath, configPath } = getPaths();
    let { showInfo } = createLogger('[Expired-Users]');

    showInfo(`Start`);

    // Disable Expired Users
    let usages = await readLogFile(accessLogPath);
    let config = readConfig(configPath);
    let isConfigChanged = false;
    for (let inbound of config?.inbounds ?? []) {
        let users = inbound.settings?.clients ?? [];
        for (let user of users) {
            let expireDays = user?.expireDays ?? defaultExpireDays;
            let usage = usages[user?.email ?? ''];
            let strBillingStartDate = user?.billingStartDate ?? user?.firstConnect ?? usage?.firstConnect ?? user?.createDate;
            // Ignore user without any date
            if (!strBillingStartDate) continue;
            let billingStartDate = new Date(strBillingStartDate);
            let expireDate = DateUtil.addDays(billingStartDate, expireDays);

            if (user?.deActiveReason?.includes('Expired') == true || !billingStartDate || !user?.email)
                continue;
            
            // Set user first connect
            if (!user.firstConnect && usage?.firstConnect) {
                user.firstConnect = String(usage.firstConnect) ?? user.firstConnect;
                isConfigChanged = true;
            }

            // Set billing start date
            if (!user.billingStartDate && billingStartDate) {
                user.billingStartDate = billingStartDate?.toString();
                isConfigChanged = true;
            }

            // User expired
            if (expireDate && expireDate?.getTime() < Date.now()) {
                isConfigChanged = true;
                cron.needRestartService = true;
                user.expiredDate = String(new Date());
                setUserActive(config, inbound.tag ?? null, user?.email, false, `Expired after "${expireDays}" days`, env.EXPIRED_USER_TAG ?? 'baduser');
                showInfo(`De-active user "${user?.email}" due to expiration at "${expireDate}" after "${expireDays}" days from "${billingStartDate}"`);
            }
            // Quota limit
            else if (!user.deActiveDate && user.quotaLimit && usage?.quotaUsage && usage?.quotaUsage > user.quotaLimit) {
                isConfigChanged = true;
                cron.needRestartService = true;
                setUserActive(config, inbound.tag ?? null, user?.email, false, `Bandwith used`, env.QUOTA_USER_TAG ?? 'baduser');
                showInfo(`De-active user "${user?.email}" due to bandwidth usage`);
            }
        }
    }

    if (isConfigChanged)
        writeConfig(configPath, config);

    showInfo(`Complete`);
}

module.exports = { cronExpiredUsers };