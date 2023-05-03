import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useContextSWR } from "../../lib/hooks";
import { styles } from "@common/lib/styles";
import { queryString } from "@common/lib/util";
import { Copy } from "@common/components/copy";
import { DateView } from "@common/components/date-view";
import { Dialog } from "@common/components/dialog";
import { Popup } from "@common/components/popup";
import { Size } from "@common/components/size";
import { Table } from "@common/components/table";

interface UserNodesDialogProps {
    onClose?: Function
    user?: V2RayConfigInboundClient
}

export function UserNodesDialog({ onClose, user }: UserNodesDialogProps) {

    const { isValidating, mutate, data } = useContextSWR<V2RayConfigInboundClient[]>('/user/nodes' + queryString({
        userId: user?.id,
        email: user?.email
    }));

    return <Dialog onClose={onClose} title={`User ${user.email} - Other Server nodes`}>
        <Table
            loading={isValidating}
            columns={[ 'Server', 'Inbound', 'Status', 'Last Connect', 'Last Connect IP', 'De-active date', 'De-active reason', 'Bandwidth (After Billing Date)', 'Bandwidth (This Month)' ]}
            rows={isValidating ? [] : data ?? []}
            groupBy={u => u.serverNode}
            groupFooter={(g, items) => {
                return <tr>
                    <td className="bg-slate-200 h-[1px]" colSpan={10}></td>
                </tr>
            }}
            cellMerge={['Bandwidth (After Billing Date)', 'Last Connect', 'Last Connect IP', 'Server', 'De-active date', 'Status', 'Bandwidth (This Month)', 'De-active reason', 'Last Connect', 'Inbound']}
            cells={u => [
                u.serverNode,
                u['inboundTag'],
                u.deActiveDate ? 'De-active' : 'Active',
                <DateView key={'merge-' + u['lastConnect']} precision={true} full={false} date={u['lastConnect']}/>,
                u['lastConnectIP'],
               <DateView key={'merge-' + (u.deActiveDate ?? '-')} precision={true} full={false} date={u.deActiveDate}/>,
                <Popup key={'merge-' + u.deActiveReason} popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                    <Copy data={u.deActiveReason}>
                        {(u.deActiveReason?.length ?? 0) > 30 ? u.deActiveReason?.substring(0,30) + '...' : (u.deActiveReason ?? '-')}
                    </Copy>
                </Popup>,
                <Size key={'merge-' + u['quotaUsageAfterBilling']} size={u['quotaUsageAfterBilling'] ?? 0}/>,
                <Size key={'merge-' + u['quotaUsage']} size={u['quotaUsage'] ?? 0}/>
            ]}
        />
        <div className="flex text-xs mt-2">
            <button className={styles.buttonItem} type="button" onClick={() => mutate()}>
                <ArrowPathIcon className="w-4"/>
                Refresh
            </button>
        </div>
    </Dialog>
}