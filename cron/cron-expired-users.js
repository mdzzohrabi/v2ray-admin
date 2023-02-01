// @ts-check

const { env } = require("process");
const { getPaths, readLogFile, DateUtil, setUserActive, createLogger } = require("../lib/util");

/**
 * De-active expired users
 * @param {import("./cron").CronContext} cron Cron context
 * @param {number} defaultExpireDays Expire days
 * @returns 
 */
async function cronExpiredUsers(cron, defaultExpireDays) {
    let { accessLogPath } = getPaths();
    let { config } = cron;
    let { showInfo } = createLogger();

    showInfo(`Start Expired Users Cron`)

    // Disable Expired Users
    let usages = await readLogFile(accessLogPath);
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
                cron.isConfigChanged = true;
            }

            // Set billing start date
            if (!user.billingStartDate && billingStartDate) {
                user.billingStartDate = billingStartDate?.toString();
                cron.isConfigChanged = true;
            }

            // User expired
            if (expireDate && expireDate?.getTime() < Date.now()) {
                cron.isConfigChanged = true;
                cron.needRestartService = true;
                user.expiredDate = String(new Date());
                setUserActive(config, inbound.tag ?? null, user?.email, false, `Expired after "${expireDays}" days`, env.EXPIRED_USER_TAG ?? 'baduser');
                showInfo(`De-active user "${user?.email}" due to expiration at "${expireDate}" after "${expireDays}" days from "${billingStartDate}"`);
            }
            // Quota limit
            else if (user.quotaLimit && usage?.quotaUsage && usage?.quotaUsage > user.quotaLimit) {
                cron.isConfigChanged = true;
                cron.needRestartService = true;
                setUserActive(config, inbound.tag ?? null, user?.email, false, `Bandwith used`, env.QUOTA_USER_TAG ?? 'baduser');
                showInfo(`De-active user "${user?.email}" due to bandwidth usage`);
            }
        }
    }
}

module.exports = { cronExpiredUsers };