import { ArrowPathIcon, BellSlashIcon, BoltIcon, BoltSlashIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { FormEvent, useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { Container } from "../../components/container";
import { Dialog, useDialog } from "../../components/dialog";
import { Field, FieldObject, FieldsGroup } from "../../components/fields";
import { PopupMenu } from "../../components/popup-menu";
import { Table } from "../../components/table";
import { Tabs } from "../../components/tabs";
import { useCRUD, usePrompt } from "../../lib/hooks";
import { styles } from "../../lib/styles";

export function SystemUserDialog({ user: userProp, onClose, onDone }: { user?: SystemUser, onDone?: (user: SystemUser) => any, onClose?: Function }) {
    const [user, setUser] = useState(userProp ?? {});
    const isNew = !userProp;
    const onSubmit = useCallback(async (e: FormEvent) => {
        e?.preventDefault();
        try {
            let result = await onDone?.call(this, user);
            if (result)
                onClose?.call(this);
        }
        catch (err) {
            toast.error(err?.message);
        }
    }, [user]);
    
    return <Dialog onClose={onClose} title={'System User'} onSubmit={onSubmit}>
        <FieldsGroup data={user} dataSetter={setUser}>
            <div className="flex flex-row items-center">
                <Field htmlFor="username" label="Username" className="flex-1">
                    <input type="text" id="username" required placeholder="Username" className={styles.input}/>
                </Field>
                <Field htmlFor="isActive" label="Active">
                    <input type="checkbox" id="isActive" className={styles.input}/>
                </Field>
            </div>
            <Field htmlFor="password" label="Password" hint={'Leave empty if you won\'t to change password'}>
                <input type="password" id="password" placeholder="Password" className={styles.input}/>
            </Field>
            <div className="flex flex-row my-2">
                <Field htmlFor="email" className="flex-1" label="E-Mail">
                    <input type="email" id="email" placeholder="@" className={styles.input}/>
                </Field>
                <Field htmlFor="mobile" label="Mobile">
                    <input type="tel" id="mobile" placeholder="+98" className={styles.input}/>
                </Field>
            </div>
            <Tabs>
                <Tabs.Tab title="Pricing" isSelected={true}>
                    <FieldObject path={'pricing'}>
                        <Field htmlFor="newUserCost" label="New User Cost">
                            <input type="number" id="newUserCost" placeholder="0" className={styles.input}/>
                        </Field>
                        <Field htmlFor="renewUserCost" label="Re-new User Cost">
                            <input type="number" id="renewUserCost" placeholder="0" className={styles.input}/>
                        </Field>
                    </FieldObject>
                </Tabs.Tab>
                <Tabs.Tab title="Access Control List (Acl)" isSelected={true} className="text-sm grid grid-cols-4">
                    <FieldObject path={'acls'}>
                        <div  className="col-span-1 border-t-[1px] p-2">
                            <span className="block font-bold">Super Admin</span>
                            <Field htmlFor="isAdmin" horizontal label="is Admin">
                                <input type="checkbox" id="isAdmin" className={styles.input}/>
                            </Field>
                        </div>
                        <FieldObject path={'logs'}>
                            <div className="col-span-1 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Logs</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'trafficUsage'}>
                            <div className="col-span-1 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Traffic Usage</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'config'}>
                            <div className="col-span-1 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Config</span>
                                <div className="grid grid-cols-2 gap-x-2">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'transactions'}>
                            <div className="col-span-2 border-t-[1px] p-2">
                                <span className="block font-bold">Transactions</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="add" horizontal label="Add">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="add" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="delete" horizontal label="Delete">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="delete" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'serverNodes'}>
                            <div className="col-span-2 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Server Nodes</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="add" horizontal label="Add">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="add" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="delete" horizontal label="Delete">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="delete" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'users'}>
                            <div className="col-span-4 border-t-[1px] p-2">
                                <span className="block font-bold">Users</span>
                                <div className="grid grid-cols-3 gap-x-2">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="add" horizontal label="Add">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="add" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="delete" horizontal label="Delete">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="delete" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="renew" horizontal label="Re-new (+1 Month)">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="renew" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="active" horizontal label="Active/Deactive">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="active" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="subscribeUrl" horizontal label="Subscription URL">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="subscribeUrl" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="clientConfig" horizontal label="Client Config">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="clientConfig" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="freeUsers" horizontal label="View Free Users">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="freeUsers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeFree" horizontal label="Change Free/Paid Users">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="changeFree" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="privateUsers" horizontal label="View Private Users">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="privateUsers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changePrivate" horizontal label="Change Private/Public Users">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="changePrivate" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="regenerateId" horizontal label="Re-generate ID">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="regenerateId" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeInbound" horizontal label="Change Inbound">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="changeInbound" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="copyUser" horizontal label="Copy User to another Inbound">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="copyUser" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="setFirstConnectionAsCreateDate" horizontal label="Set first connect as create date">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="setFirstConnectionAsCreateDate" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="dailyUsage" horizontal label="Daily Usage">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="dailyUsage" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="logs" horizontal label="Logs">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="logs" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'config'}>
                            <div className="col-span-4 border-t-[1px] p-2">
                                <span className="block font-bold">Home</span>
                                <div className="grid grid-cols-5 gap-x-2">
                                    <Field htmlFor="show" horizontal label="Show">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="show" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="traffics" horizontal label="Traffics">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="traffics" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="users" horizontal label="Traffics">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="users" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="servers" horizontal label="Servers">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="servers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="transactions" horizontal label="Transactions">
                                        <input disabled={user?.acls?.isAdmin} type="checkbox" id="transactions" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                    </FieldObject>
                </Tabs.Tab>
            </Tabs>
        </FieldsGroup>
        <div className="flex flex-row pt-2">
            <button type="submit" className={styles.buttonItem}>
                { isNew ? <PlusIcon className="w-4"/> : <PencilIcon className="w-4"/> }
                { isNew ? 'Add' : 'Edit' } User
            </button>
        </div>
    </Dialog>
}

export default function SystemUsersPage() {
    const { edit, insert, remove, isLoading, isItemsLoading, items, refreshItems } = useCRUD<SystemUser>('/system/users', {});
    const userDialog = useDialog((user?: SystemUser, onDone?: (user: SystemUser) => any, onClose?: Function) => <SystemUserDialog user={user} onDone={onDone} onClose={onClose}/>)
    const prompt = usePrompt();
    
    return <Container pageTitle={'System Users'}>
        <FieldsGroup title={
            <span className="flex items-center gap-x-2">
                <UsersIcon className="w-6"/>
                System Users
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
                        row.id,
                        row.username,
                        row.email,
                        row.mobile,
                        <div className="flex flex-row items-center gap-x-2">
                            {row.isActive?<BoltIcon className="w-4"/>:<BoltSlashIcon className="w-4"/>}
                            {row.isActive?'Active':'De-active'}
                        </div>,
                        <PopupMenu>
                            <PopupMenu.Item icon={<PencilIcon className='w-4'/>} action={() => userDialog.show(row, edit)}>
                                Edit User
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