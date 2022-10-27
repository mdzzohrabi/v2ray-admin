const { readLogFile, getPaths } = require("./util");
const {createServer} = require('net');

async function main() {
    let server = createServer(socket => {
        console.log(`New Connection !`);
        socket.once('data', buffer => {
            console.log(buffer.toString('utf-8'));
            let response = `HTTP/1.1 301 Moved Permanently\r\nLocation: http://192.168.136.137:1254/\r\nContent-Type: text/html\r\n\r\nPlease follow`;
            console.log(response);
            socket.end(response);
        });
    });
    server.listen(1255, () => console.log(`Server started`));
    // let {accessLogPath} = getPaths();
    // console.log(await readLogFile(accessLogPath));
}

main();