// @ts-check
import React, { useContext, useMemo } from "react";
import { useState } from "react";
import useSWR from "swr";
import { serverRequest } from "../lib/util";
import { AppContext } from "./app-context";
import { Dialog } from "./dialog";
import { Field, FieldsGroup } from "./fields";

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

    let request = useMemo(() => {
        return serverRequest.bind(this, context.server);
    }, [context]);

    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {mutate: refreshNodes, data: nodes, isValidating: isLoading} = useSWR('/nodes', request, {
        revalidateOnFocus: false,
        revalidateOnMount: true
    });

    let [state, setState] = useState({
        server: 'local',
        inboundTag: tag
    });

    let remoteRequest = useMemo(() => {
        let node = nodes?.find(x => x.id == state.server);
        if (node) {
            return serverRequest.bind(this, {
                url: node.address,
                token: node.apiKey
            });
        }
        return null;
    }, [context]);

    
    /** @type {import("swr").SWRResponse<string[]>} */
    let {mutate: refreshInbounds, data: inbounds, isValidating: isLoadingInbounds} = useSWR(remoteRequest ? '/api/user_inbounds' : null, remoteRequest, {
        revalidateOnFocus: false,
        revalidateOnMount: true
    });

    return <Dialog onClose={onClose} title={'Client Config - ' + user.email}>
        <FieldsGroup data={state} dataSetter={setState}>
            <Field label="Server" htmlFor="server">
                <select id="server">
                    {nodes?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
            </Field>
            <Field label="Inbound" htmlFor="inboundTag">
                <select id="inboundTag">
                    {inbounds?.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
            </Field>
        </FieldsGroup>
    </Dialog>
}