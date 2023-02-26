// @ts-check
const { getTransactions } = require("../lib/db");
const { readConfig, getPaths, db, createLogger, writeConfig } = require("../lib/util");

/**
 * 
 * @param {import(".").CronContext} cron 
 */
async function cronSync(cron) {

    let {showError, showInfo, showWarn} = createLogger('[Sync]');

    /**
     * 
     * @param {ServerNode} serverNode 
     * @param {string} action 
     * @param {string} method 
     * @param {any} body 
     * @returns {Promise<any>}
     */
    async function request(serverNode, action, method = 'GET', body = undefined) {
        return await fetch(serverNode.address + action, {
            method,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                'Authorization': 'Bearer ' + Buffer.from(serverNode.apiKey, 'utf-8').toString('base64'),
                'Content-Type': 'application/json'
            }
        })
        .then(async result => {
            try {
                return await result.json();
            }
            catch (err) {
                showError(err?.message);
                showError(await result.text());
            }
        });
    }

    showInfo('Start');

    let { default: fetch } = await import('node-fetch');
    let {configPath} = getPaths();
    let tempConfig = readConfig(configPath);

    /** @type {ServerNode[]} */
    let serverNodes = await db('server-nodes') ?? [];

    if (!serverNodes) {
        showInfo(`No server nodes defined`);
        return;
    }

    // Sync Inbounds - Begin
    let inbounds = tempConfig.inbounds?.filter(x => !!x.usersServerNode) ?? [];

    if (inbounds.length == 0)
        showInfo(`No inbound to sync`);

    for (let inbound of inbounds) {
        let serverNode = serverNodes.find(x => x.id == inbound.usersServerNode);
        let mirrorInbound = inbound.mirrorInbound;
        showInfo(`Sync clients for inbound ${inbound.tag} [${inbound.protocol}] from ${serverNode?.name ?? '[n/A]'}`);
        if (serverNode) {
            try {
                /** @type {{ clients?: V2RayConfigInboundClient[], error?: string }} */
                let result = await request(serverNode,'/api/clients?tag=' + mirrorInbound);

                if (!result || result.error) {
                    showError(result?.error ?? 'Fetch from server failed');
                    continue;
                }

                let clients = result.clients ?? [];

                /** @type {ServerNode[]} */
                let serverNodesToUpdate = await db('server-nodes') ?? [];
                let node = serverNodesToUpdate.find(x => x.id == serverNode?.id);
                if (node) {
                    node.lastConnectDate = new Date().toLocaleString();
                    node.lastSyncDate = new Date().toLocaleString();
                }
                await db('server-nodes', serverNodesToUpdate);

                // Local Clients
                let localClients = inbound.settings?.clients ?? [];

                // Local Clients counter
                let localCount = localClients.length;

                // Iterate over remote fetched clients
                for (let client of clients) {
                    // Ignore de-active users
                    if (!!client.deActiveDate) continue;

                    // Find if client exists
                    let localClient = localClients.find(x => x.email == client.email);

                    // Insert new
                    if (!localClient) {
                        client.serverNode = inbound.usersServerNode;
                        client.serverNodeInbound = inbound.mirrorInbound;
                        localClients.push(client);
                        // Restart service
                        cron.needRestartService = true;
                    }
                    // Update client
                    else if (localClient.serverNode == inbound.usersServerNode && localClient.serverNodeInbound == inbound.mirrorInbound) {
                        let localIndex = localClients.indexOf(localClient);
                        // Check if client changed
                        if (localIndex >= 0) {
                            client.serverNode = inbound.usersServerNode;
                            client.serverNodeInbound = inbound.mirrorInbound;
                            localClients[localIndex] = client;
                            // Restart service only if user-id was changed
                            if (localClient?.id != client?.id) {
                                cron.needRestartService = true;
                            }
                        }
                    }
                }

                // Remove removed or de-activated clients
                localClients = localClients.filter(client => {
                    if (client.serverNode != serverNode?.id) return true;
                    return clients.some(x => x.email == client.email && !x.deActiveDate)
                });

                if (!inbound.settings) inbound.settings = {};

                inbound.settings.clients = localClients;

                // Restart Service if Client count changed
                if (inbound?.settings?.clients?.length ?? 0 != localCount) {
                    cron.needRestartService = true;
                }

            } catch (e) {
                showError(e?.message);
            }
            showInfo(`Inbound sync complete`);
        }
    }

    // Update Config
    let config = readConfig(configPath);

    for (let inbound of inbounds) {
        let found = config?.inbounds?.find(x => x.tag == inbound.tag && x.protocol == inbound.protocol);
        if (found) {
            found.settings = inbound.settings;
        }
    }

    showInfo(`Save config`);
    writeConfig(configPath, config);
    // Sync Inbounds - End

    // Sync Database
    let syncServers = serverNodes.filter(x => x.sync && x.type == 'server');

    // Sync Transactions
    let transactions = await getTransactions();
    for (let server of syncServers) {
        try {
            showInfo(`Upload transactions to "${server.name}"`)
            let result = await request(server, '/api/sync/transactions', 'POST', transactions);
            showInfo(result?.message);
            showInfo(`Inserted: ${result.inserted}, Removed: ${result.removed}, Modified: ${result.modified}`);
        }
        catch (err) {
            showError(err?.message);
        }
    }

    // Sync usages
    let userUsages = await db('user-usages');
    for (let server of syncServers) {
        try {
            showInfo(`Upload user usages to "${server.name}"`)
            let result = await request(server, '/api/sync/user-usages', 'POST', userUsages);
            showInfo(result?.message);
        }
        catch (err) {
            showError(err?.message);
        }
    }

    showInfo('Complete');

}

module.exports = { cronSync };