import { useDialog } from "@common/components/dialog";
import { FieldsGroup } from "@common/components/fields";
import { PopupMenu } from "@common/components/popup-menu";
import { Table } from "@common/components/table";
import { usePrompt } from "@common/lib/hooks";
import { ArrowPathIcon, BoltIcon, BoltSlashIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { SystemUserDialog } from "../../components/dialog/system-user-dialog";
import { SystemUserSessionsDialog } from "../../components/dialog/system-user-sessions-dialog";
import { useCRUD } from "../../lib/hooks";
import { styles } from "../../lib/styles";
import { Container } from "../../components/container";


export default function SystemUsersPage() {
    const { edit, insert, remove, isLoading, isItemsLoading, items, refreshItems } = useCRUD<SystemUser>('/system/users', {});
    const userDialog = useDialog((user?: SystemUser, onDone?: (user: SystemUser) => any, onClose?: Function) => <SystemUserDialog user={user} onDone={onDone} onClose={onClose}/>)
    const userSessionsDialog = useDialog((userId?: string, onClose?: Function) => <SystemUserSessionsDialog userId={userId} onClose={onClose}/>)
    const prompt = usePrompt();
    const NA = <span className="text-gray-400">N/A</span>
    
    return <Container pageTitle={'System Administrators'}>
        <FieldsGroup title={
            <span className="flex items-center gap-x-2">
                <UsersIcon className="w-6"/>
                System Administrators
            </span>
        } className="px-3">
            <div className="flex-1 flex-row flex items-center">
                {isLoading || isItemsLoading? <span className="rounded-lg bg-gray-700 text-white px-3 py-0">Loading</span> :null}
            </div>
            <div className="flex flex-row">
                <button type={"button"} onClick={() => refreshItems()} className={classNames(styles.buttonItem)}>
                    <ArrowPathIcon className="w-4"/>
                    Reload
                </button>
                <button onClick={e => userDialog.show(null, insert)} className={classNames(styles.buttonItem)}>
                    <PlusIcon className="w-4"/>
                    Add User
                </button>
            </div>
        </FieldsGroup>
        <div className="p-3">
            <div className="rounded-lg flex flex-col flex-1 border-2">
                <Table
                    rows={items ?? []}
                    columns={[ 'ID', 'Username', 'Email', 'Mobile', 'Active', 'Actions' ]}
                    cells={row => [
                        row.id ?? '-',
                        row.username,
                        row.email ?? NA,
                        row.mobile ?? NA,
                        <div className="flex flex-row items-center gap-x-2">
                            {row.isActive?<BoltIcon className="w-4"/>:<BoltSlashIcon className="w-4"/>}
                            {row.isActive?'Active':'De-active'}
                        </div>,
                        <PopupMenu>
                            <PopupMenu.Item icon={<PencilIcon className='w-4'/>} action={() => userDialog.show(row, edit)}>
                                Edit User
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<BoltIcon className='w-4'/>} action={() => userSessionsDialog.show(row.id)}>
                                Sessions
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<TrashIcon className="w-4"/>} action={() => prompt(`Delete user "${row.username}" ?`, 'Delete user', () => remove(row))}>
                                Delete
                            </PopupMenu.Item>
                        </PopupMenu>
                    ]}
                    
                />
            </div>
        </div>
    </Container>
}