// @ts-check
const { getPaths, parseArgumentsAndOptions, readLogLines, createLogger } = require("./util");

const {
    cliArguments: [search],
    cliOptions: {email, users, records = true}
} = parseArgumentsAndOptions();

let {showInfo, showError, showWarn} = createLogger();

async function searchCommand() {    
    let {accessLogPath} = getPaths();

    let lines = readLogLines(accessLogPath);
    let _users = new Set();

    for await (let line of lines) {
        let {user, dateTime, clientAddress, status, destination, route} = line;
        if (destination.includes(search) && (!email || user == email)) {
            _users.add(user);
            if (records)
                showInfo(`${dateTime.toLocaleString()}${email?'':'\t' + user}\t${status}\t${route}\t${clientAddress}\t${destination}`);
        }
    }

    if (users) console.table(_users);

    showInfo('Complete.');
}

searchCommand();