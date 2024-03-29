// @ts-check
const { env } = require("process");
const { getTransactions } = require("../lib/db");
const { readConfig, getPaths, db, createLogger, writeConfig, serverNodeRequest: request } = require("../lib/util");

/**
 * 
 * @param {import(".").CronContext} cron 
 */
async function cronSync(cron) {

    let {showError, showInfo, showWarn} = createLogger('[Sync]');
    const deActiveClientID = `827c9c48-2e7e-4ff1-8b20-895a6c345ce0`;

    showInfo('Start');

    let {configPath} = getPaths();
    let tempConfig = readConfig(configPath);

    /** @type {import("../types").ServerNode[]} */
    let serverNodes = await db('server-nodes') ?? [];

    serverNodes = serverNodes.filter(x => !x.disabled);

    if (!serverNodes) {
        showInfo(`No server nodes defined`);
        return;
    }

    // Sync Inbounds - Begin
    let inbounds = tempConfig.inbounds?.filter(x => !!x.usersServerNode) ?? [];

    if (inbounds.length == 0)
        showInfo(`No inbound to sync`);

    for (let inbound of inbounds) {
        let serverNode = serverNodes.find(x => x.id == inbound.usersServerNode && x.sync && x.type == 'server');
        let mirrorInbound = inbound.mirrorInbound;
        showInfo(`Sync clients for inbound ${inbound.tag} [${inbound.protocol}] from ${serverNode?.name ?? '[n/A]'}`);
        if (serverNode) {
            try {
                /** @type {{ clients?: import("../types").V2RayConfigInboundClient[], error?: string }} */
                let result = await request(serverNode,'/api/clients?tag=' + mirrorInbound);

                if (!result || result.error) {
                    showError(result?.error ?? 'Fetch from server failed');
                    continue;
                }

                let clients = result.clients ?? [];

                /** @type {import("../types").ServerNode[]} */
                let serverNodesToUpdate = await db('server-nodes') ?? [];
                let node = serverNodesToUpdate.find(x => x.id == serverNode?.id);
                if (node) {
                    node.lastConnectDate = new Date().toLocaleString();
                    node.lastSyncDate = new Date().toLocaleString();
                }
                await db('server-nodes', serverNodesToUpdate);

                // Local Clients
                let localClients = inbound.settings?.clients ?? [];

                // Iterate over remote fetched clients
                for (let client of clients) {
                    // Change de-active users ID
                    if (!!client.deActiveDate) {
                        client.id = deActiveClientID;
                    }

                    // Find if client exists
                    let localClient = localClients.find(x => x.email == client.email);

                    // Insert new
                    if (!localClient) {
                        client.serverNode = inbound.usersServerNode;
                        client.serverNodeInbound = inbound.mirrorInbound;
                        localClients.push(client);
                        // Restart service
                        cron.needRestartService = true;
                        showInfo(`Request restart service due to new client`);
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
                            if (localClient?.id != client?.id || localClient?.flow != client?.flow) {
                                cron.needRestartService = true;
                                showInfo(`Request restart service due to client id change`)
                            }
                        }
                    }
                }

                let hasRemovedUser = false;

                // Remove removed
                localClients = localClients.filter(client => {
                    let isOK = (client.serverNode != serverNode?.id) || clients.some(x => x.email == client.email);
                    if (!isOK) {
                        showInfo(`User "${client.email}" removed from remote`);
                        hasRemovedUser = true;
                    }
                    return isOK;
                });
                    
                if (hasRemovedUser) {
                    showInfo(`Request restart service due to some clients removed`);
                    cron.needRestartService = true;                        
                }

                if (!inbound.settings) inbound.settings = {};

                inbound.settings.clients = localClients;

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

    /**
     * Update user usages
     * @type {import("../types").UserUsages}
     */
    let userUsages = await db('user-usages') ?? {};
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

    /**
     * Update traffic usages
     * @type {import("../types").TrafficUsages}
     */
    let trafficUsages = await db('traffic-usages') ?? {};

    if (env.SYNC_ALL_DAYS != 'true') {
        let date = new Date().toLocaleDateString();
        trafficUsages = { [date]: trafficUsages[date] ?? [] };
    }

    for (let server of syncServers) {
        try {
            showInfo(`Upload traffic usages to "${server.name}"`)
            let result = await request(server, '/api/sync/traffic-usages', 'POST', trafficUsages);
            showInfo(result?.message);
        }
        catch (err) {
            showError(err?.message);
        }
    }

    showInfo('Complete');

}

module.exports = { cronSync };