import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useContextSWR } from "../../lib/hooks";
import { styles } from "../../lib/styles";
import { DateView } from "../date-view";
import { Dialog } from "../dialog";
import { Popup } from "../popup";
import { Size } from "../size";
import { Table } from "../table";

interface UserNodesDialogProps {
    onClose?: Function
    user?: V2RayConfigInboundClient
}

export function UserNodesDialog({ onClose, user }: UserNodesDialogProps) {

    const { isValidating, mutate, data } = useContextSWR<V2RayConfigInboundClient[]>('/user/nodes?userId=' + user?.id);

    return <Dialog onClose={onClose} title={`User ${user.email} - Other Server nodes`}>
        <Table
            loading={isValidating}
            columns={[ 'Server', 'Status', 'Last Connect', 'De-active date', 'De-active reason', 'Bandwidth (After Billing Date)', 'Bandwidth (This Month)' ]}
            rows={data ?? []}
            cells={u => [
                u.serverNode,
                u.deActiveDate ? 'De-active' : 'Active',
                <DateView precision={true} full={false} date={u['lastConnect']}/>,
                <DateView precision={true} full={false} date={u.deActiveDate}/>,
                <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                    {(u.deActiveReason?.length ?? 0) > 30 ? u.deActiveReason?.substring(0,30) + '...' : (u.deActiveReason ?? '-')}
                </Popup>,
                <Size size={u['quotaUsageAfterBilling'] ?? 0}/>,
                <Size size={u['quotaUsage'] ?? 0}/>
            ]}
        />
        <div className="flex text-xs">
            <button className={styles.buttonItem} type="button" onClick={() => mutate()}>
                <ArrowPathIcon className="w-4"/>
                Refresh
            </button>
        </div>
    </Dialog>
}