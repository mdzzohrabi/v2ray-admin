// @ts-check
const { writeFile } = require('fs/promises');
const { resolve } = require('path');
const { parseArgumentsAndOptions, createLogger, getPaths, readConfig, readLogFile } = require('../lib/util');

async function users() {
    const { showError, showInfo, showOk } = createLogger();
    let {configPath} = getPaths();
    let {
        cliOptions: { help, output = '/usr/local/etc/v2ray/config.bridge.json' }
    } = parseArgumentsAndOptions();
    
    showInfo(`Create V2Ray TCP to WS Bridge configuration`);

    let config = readConfig(configPath);

    if (Array.isArray(config.inbounds) == false)
        return showError('No inbounds defined in configuration');

    /** @type {V2RayConfigInboundClient[]} */
    let clients = [];
    /** @type {V2RayConfigRoutingRule[]} */
    let rules = [];
    /** @type {V2RayConfigOutbound[]} */
    let outbounds = [];

    /**
     * @type {V2RayConfig}
     */
    let newConfig = {
        log: {
            access: '/var/log/v2ray/access.bridge.log',
            error: '/var/log/v2ray/error.bridge.log',
            logLevel: 'warning'
        },
        inbounds: [
            {
                listen: '0.0.0.0',
                port: '9090',
                protocol: 'vmess',
                settings: {
                    clients
                },
                streamSettings: {
                    network: 'ws'
                }
            }
        ],
        outbounds,
        routing: {
            rules
        }
    };

    for (let inbound of config?.inbounds ?? []) {
        showInfo(`Users of protocol "${inbound.protocol}"${inbound.tag ? `, Tag: ${inbound.tag}` : ''}`);
        let users = inbound.settings?.clients ?? [];
        for (let user of users) {
            // Client
            clients.push({
                id: user.id,
                email: user.email,
                level: user.level
            });
            // Outbound
            outbounds.push({
                tag: 'outbound-' + user.email,
                protocol: 'vmess',
                settings: {
                    vnext: [
                            {
                            address: '188.121.106.182',
                            port: 443,
                            users: [
                                {
                                    id: user.id,
                                    security: 'auto'
                                }
                            ]
                        }
                    ]
                },
                streamSettings: {
                    network: 'tcp',
                    tcpSettings: {
                        header: {
                            type: "http"
                        }
                    }
                }
            });
            // Rule
            rules.push({
                type: 'field',
                user: [user.email ?? ''],
                outboundTag: 'outbound-' + user.email
            })
        }
    }

    let path = resolve(output);

    await writeFile(path, JSON.stringify(newConfig, null, "\t"));
    showInfo(`Config writed to "${path}"`)
}

users();