// @ts-check
import React, { useContext } from 'react';
import useSWR from 'swr';
import { serverRequest } from "../lib/util";
import { AppContext } from './app-context';
import { Copy } from './copy';
import { Popup } from './popup';

export function ServerNode({ serverId }) {

    
    let context = useContext(AppContext);
    
    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {data: nodes, mutate: refreshNodes, isValidating: isLoading} = useSWR('/nodes', serverRequest.bind(this, context.server));
    
    if (!serverId || serverId == 'local') return <>local</>;

    let node = nodes?.find(x => x.id == serverId);

    return <>{
        isLoading ? 'Loading...' : 
        <Popup popup={node?.lastConnectIP}>
            <Copy data={node?.id} copiedText="Node Server ID Copied">{node?.name}</Copy>
        </Popup> ?? 'Not Found'}
    </>;
}