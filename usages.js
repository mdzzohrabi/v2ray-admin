// @ts-check
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile, readLogLines, cache } = require('./lib/util');

async function usages() {
    const { showError, showInfo, showOk } = createLogger();

    let {configPath, accessLogPath} = getPaths();
    let {
        cliOptions: { help }
    } = parseArgumentsAndOptions();

    
    if (help)
        return showInfo(`usage: node usages`);

    showInfo(`Process V2Ray log file to create usage informations`);
    let lines = readLogLines(accessLogPath, 'daily-usage-bytes');
    let dailyUsage = await cache('daily-usage') ?? {};
    
    for await (let line of lines) {
        let ip = line.clientAddress?.split(':');
        if (!line.dateTime || line.status != 'accepted' || !ip) continue;
        let date = line.dateTime.toLocaleDateString();

        // Create Date Node
        dailyUsage[ date ] = dailyUsage[ date ] ?? {};

        // Create user node
        let user = dailyUsage[ date ][ line.user ] ?? {};
        dailyUsage[date][line.user] = user;

        // Outbound Tag
        let outboundTag = line.route.replace(/\[|\]/g, '');

        // Info object
        let info = user[outboundTag] ?? {
            counter: 0,
            firstConnect: undefined,
            lastConnect: undefined,
            firstConnectLogOffset: undefined,
            lastConnectLogOffset: undefined,
        };

        dailyUsage[date][line.user][outboundTag] = info;

        // Increase counter
        info.counter++;

        // Set first connect
        if (!info.firstConnect) {
            info.firstConnect = line.dateTime.getTime();
            info.firstConnectLogOffset = line.offset;
        }

        // Set last connect
        if (!info.lastConnect || (new Date(info.lastConnect).getTime()) < line.dateTime.getTime()) {
            info.lastConnect = line.dateTime.getTime();
            info.lastConnectLogOffset = line.offset;
        }
    }

    // Save data
    console.log(`Save data`);
    await cache('daily-usage', dailyUsage);

}

usages();