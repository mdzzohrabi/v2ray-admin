import { Copy } from '@common/components/copy';
import { Popup } from '@common/components/popup';
import useSWR from 'swr';
import { ServerNode } from '../../../types';
import { useRequest } from '../lib/hooks';

export function ServerNode({ serverId }) {   
    const request = useRequest();
    const {data: nodes, mutate: refreshNodes, isValidating: isLoading} = useSWR<ServerNode[]>('/nodes', request, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnMount: false
    });
    
    if (!serverId || serverId == 'local') return <>local</>;

    const node = nodes?.find(x => x.id == serverId);

    return <>{
        isLoading ? 'Loading...' : 
        <Popup popup={node?.lastConnectIP}>
            <Copy data={node?.id} copiedText="Node Server ID Copied">{node?.name}</Copy>
        </Popup> ?? 'Not Found'}
    </>;
}