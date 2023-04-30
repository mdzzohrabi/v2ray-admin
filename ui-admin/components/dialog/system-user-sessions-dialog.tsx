import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCRUD, usePrompt } from "../../lib/hooks";
import { styles } from "../../lib/styles";
import { DateView } from "../date-view";
import { Dialog } from "../dialog";
import { PopupMenu } from "../popup-menu";
import { Table } from "../table";

export function SystemUserSessionsDialog({ userId, onClose }: { userId: string, onClose?: Function }) {
    const {items: sessions, refreshItems, isItemsLoading: isLoading, isLoading: isDeleting, remove} = useCRUD<LoginSession>(`/system/user/${userId}/sessions`);
    const prompt = usePrompt();

    return <Dialog onClose={onClose} title="Admin Sessions">
        <Table
            columns={['Login Date', 'Last Request', 'IP', 'User Agent', 'Expired', 'Actions']}
            rows={sessions ?? []}
            cells={x => [
                <DateView date={x.loginDate}/>,
                <DateView date={x.lastRequestTime}/>,
                x.lastRequestIP,
                x.userAgent,
                x.isExpired ? 'Expired' : 'Active',
                <PopupMenu>
                    <PopupMenu.Item icon={<TrashIcon className="w-4"/>} action={() => prompt('Delete session ?', 'Delete', () => remove(x))}>Delete Session</PopupMenu.Item>
                </PopupMenu>
            ]}
            loading={isLoading || isDeleting}
        />
        <div className="flex flex-row gap-x-2 border-t-0 pt-1 mt-1 text-xs">
            <button onClick={() => refreshItems()} className={styles.buttonItem}>
                <ArrowPathIcon className="w-4"/>
                Refresh Sessions
            </button>
        </div>
    </Dialog>
}