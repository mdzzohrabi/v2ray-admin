// @ts-check
import React, { useContext, useMemo } from "react";
import { useState } from "react";
import useSWR from "swr";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";
import { AppContext } from "./app-context";
import { Copy } from "@common/components/copy";
import { Dialog } from "@common/components/dialog";
import { Field, FieldsGroup } from "@common/components/fields";

/**
 * Client Configuration
 * @param {{
 *      user: V2RayConfigInboundClient
 *      tag: string
 *      onClose: any
 * }} param0 Parameters
 * @returns 
 */
export function ClientConfig({ user, tag, onClose }) {
    let context = useContext(AppContext);

    let request = useMemo(() => serverRequest.bind(this, context.server), [context]);

    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {mutate: refreshNodes, data: nodes, isValidating: isLoading} = useSWR('/nodes', request);

    let [state, setState] = useState({
        server: 'local',
        inboundTag: tag
    });

    let selectedNode = useMemo(() => nodes?.find(x => x.id == state.server) ?? (state.server == 'local' ? {
        address: context.server.url,
        apiKey: context.server.token
    } : null), [state.server]);

    let remoteRequest = useMemo(() => {
        if (selectedNode) {
            return serverRequest.bind(this, {
                url: selectedNode.address,
                token: selectedNode.apiKey
            });
        }
        return null;
    }, [selectedNode]);

    let remoteNodeKey = useMemo(() => Math.floor(Math.random() * 1000), [remoteRequest]);
    
    /** @type {import("swr").SWRResponse<string[]>} */
    let {mutate: refreshInbounds, data: inbounds, isValidating: isLoadingInbounds} = useSWR(remoteRequest ? { url: '/api/user_inbounds?k=' + remoteNodeKey, body: user } : null, remoteRequest);

    let {data: configResponse, mutate: refreshConfig, isValidating: isLoadingConfig} = useSWR(remoteRequest && state.inboundTag && user ? {
        url: `/api/client_config?k=${remoteNodeKey}&tag=${state.inboundTag}`,
        body: user
    } : null, remoteRequest);

    let config = configResponse?.config;

    return <Dialog onClose={onClose} title={'Client Config - ' + user.email}>
        <div className="flex flex-col">
            <FieldsGroup data={state} dataSetter={setState}>
                <div className="flex flex-col">
                    <Field label="Server" htmlFor="server">
                        <select id="server" className={styles.input}>
                            <option value="local">(Local)</option>
                            {nodes?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Inbound" htmlFor="inboundTag">
                        <select id="inboundTag" className={styles.input}>
                            {inbounds?.map(x => <option key={x} value={x}>{x}</option>)}
                        </select>
                    </Field>
                </div>
            </FieldsGroup>
            <div className="flex flex-col">
                {isLoading || isLoadingConfig || isLoadingInbounds ? <span className="font-bold py-2">Loading ...</span> : null}
                {config ? <img src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(config)} alt="QR Code" /> : <span className="text-gray-600 text-center py-4">Select an Inbound to Load Config QR Code</span>}
                <div className="flex flex-row mt-2 pt-2 border-t-2">
                    <Copy className={styles.button} notifyText={`User "${user?.email}" config copied`} data={config}>
                        Copy Config
                    </Copy>
                </div>
            </div>
        </div>
    </Dialog>
}