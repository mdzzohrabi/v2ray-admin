// @ts-check
import React from 'react';
import { useContext } from 'react';
import useSWR from 'swr';
import { DateUtil, serverRequest, store, stored } from "../lib/util";
import { AppContext } from './app-context';

export function ServerNode({ serverId }) {

    
    let context = useContext(AppContext);
    
    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {data: nodes, mutate: refreshNodes, isValidating: isLoading} = useSWR('/nodes', serverRequest.bind(this, context.server), {
        
    });
    
    if (!serverId) return 'local';
    
    return <>{isLoading ? 'Loading...' : nodes?.find(x => x.id == serverId)?.name ?? 'Not Found'}</>;
}