const { readLogFile, getPaths } = require("./util");

async function main() {
    let {accessLogPath} = getPaths();
    console.log(await readLogFile(accessLogPath));
}

main();