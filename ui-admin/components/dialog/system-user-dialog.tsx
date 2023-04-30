import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { useState, useCallback, FormEvent } from "react";
import toast from "react-hot-toast";
import { useContextSWR } from "../../lib/hooks";
import { styles } from "../../lib/styles";
import { Dialog } from "../dialog";
import { FieldsGroup, Field, FieldObject } from "../fields";
import { MultiSelect } from "../multi-select";
import { Tabs } from "../tabs";

export function SystemUserDialog({ user: userProp, onClose, onDone }: { user?: SystemUser, onDone?: (user: SystemUser) => any, onClose?: Function }) {
    const [user, setUser] = useState(userProp ?? {});
    const {data: inbounds} = useContextSWR<string[]>('/inbounds/tag');
    const {data: users} = useContextSWR<{ id: string, username: string }[]>('/system/users?fields=id,username');
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
    
    return <Dialog onClose={onClose} title={'Admin'} onSubmit={onSubmit}>
        <FieldsGroup data={user} dataSetter={setUser}>
            <Tabs>
                <Tabs.Tab title="User">
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
                    <div className="flex flex-row my-2">
                        <Field htmlFor="subUsers" label="Sub Users">
                            <MultiSelect items={users?.filter(x => x.username != user?.username) ?? []} valueMember='username' displayMember='username'/>
                        </Field>
                    </div>
                </Tabs.Tab>
                <Tabs.Tab title="Pricing">
                    <FieldObject path={'pricing'}>
                        <Field htmlFor="newUserCost" label="New User Cost">
                            <input type="number" id="newUserCost" placeholder="0" className={styles.input}/>
                        </Field>
                        <Field htmlFor="renewUserCost" label="Re-new User Cost">
                            <input type="number" id="renewUserCost" placeholder="0" className={styles.input}/>
                        </Field>
                    </FieldObject>
                </Tabs.Tab>
                <Tabs.Tab id="acls" title="Access Control List (Acl)" className="text-sm grid grid-cols-4">
                    {/* <div className="flex flex-row text-xs pb-2 col-span-4">
                        <button type="button" className={styles.buttonItem} onClick={() => setAcls(false)}>
                            <MinusIcon className="w-4"/>
                            Un-Check All
                        </button>
                        <button type="button" className={styles.buttonItem} onClick={() => setAcls(true)}>
                            <PlusIcon className="w-4"/>
                            Check All
                        </button>
                    </div> */}
                    <FieldObject path={'acls'}>
                        <div className={classNames("border-t-[1px] p-2", { 'col-span-1': !user?.acls?.isAdmin, 'col-span-4': user?.acls?.isAdmin })}>
                            <span className="block font-bold">Super Admin</span>
                            <Field htmlFor="isAdmin" horizontal label="Super Admin">
                                <input type="checkbox" id="isAdmin" className={styles.input}/>
                            </Field>
                        </div>
                        {!user?.acls?.isAdmin ?
                        <>
                        <div className="col-span-3 row-span-1 border-l-[1px] border-t-[1px] p-2">
                            <span className="block font-bold">Allowed Inbounds</span>
                            <Field htmlFor="allowedInbounds" horizontal label="Inbounds">
                                <MultiSelect items={inbounds} id='allowedInbounds'/>
                                {/* <select id="allowedInbounds" multiple className={styles.input}>
                                    {inbounds?.map(x => <option key={x}>{x}</option>)}
                                </select> */}
                            </Field>
                        </div>
                        <div className="col-span-1 border-t-[1px] p-2">
                            <span className="block font-bold">Administrators</span>
                            <Field htmlFor="administrators" horizontal label="Administrators">
                                <input type="checkbox" id="administrators" className={styles.input}/>
                            </Field>
                        </div>
                        <FieldObject path={'logs'}>
                            <div className="col-span-1 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Logs</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'trafficUsage'}>
                            <div className="col-span-1 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Traffic Usage</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="customFilter" horizontal label="Custom Filter">
                                        <input type="checkbox" id="customFilter" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'config'}>
                            <div className="col-span-1 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Config</span>
                                <div className="grid grid-cols-2 gap-x-2">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'transactions'}>
                            <div className="col-span-2 border-t-[1px] p-2">
                                <span className="block font-bold">Transactions</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="add" horizontal label="Add">
                                        <input type="checkbox" id="add" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="delete" horizontal label="Delete">
                                        <input type="checkbox" id="delete" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'serverNodes'}>
                            <div className="col-span-2 border-l-[1px] border-t-[1px] p-2">
                                <span className="block font-bold">Server Nodes</span>
                                <div className="flex flex-row">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="add" horizontal label="Add">
                                        <input type="checkbox" id="add" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="delete" horizontal label="Delete">
                                        <input type="checkbox" id="delete" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'users'}>
                            <div className="col-span-4 border-t-[1px] p-2">
                                <span className="block font-bold">Clients</span>
                                <div className="grid grid-cols-3 gap-x-2">
                                    <Field htmlFor="list" horizontal label="List">
                                        <input type="checkbox" id="list" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="add" horizontal label="Add">
                                        <input type="checkbox" id="add" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="edit" horizontal label="Edit">
                                        <input type="checkbox" id="edit" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="delete" horizontal label="Delete">
                                        <input type="checkbox" id="delete" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="allUsers" horizontal label="Show all users">
                                        <input type="checkbox" id="allUsers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="deleteConnected" horizontal label="Delete Connected Client">
                                        <input type="checkbox" id="deleteConnected" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="renew" horizontal label="Re-new (+1 Month)">
                                        <input type="checkbox" id="renew" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="active" horizontal label="Active/Deactive">
                                        <input type="checkbox" id="active" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="activeExpired" horizontal label="Active/Deactive Expired">
                                        <input type="checkbox" id="activeExpired" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="subscribeUrl" horizontal label="Subscription URL">
                                        <input type="checkbox" id="subscribeUrl" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="clientConfig" horizontal label="Client Config">
                                        <input type="checkbox" id="clientConfig" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="freeUsers" horizontal label="View Free Users">
                                        <input type="checkbox" id="freeUsers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeFree" horizontal label="Change Free/Paid Users">
                                        <input type="checkbox" id="changeFree" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="privateUsers" horizontal label="View Private Users">
                                        <input type="checkbox" id="privateUsers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changePrivate" horizontal label="Change Private/Public Users">
                                        <input type="checkbox" id="changePrivate" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="regenerateId" horizontal label="Re-generate ID">
                                        <input type="checkbox" id="regenerateId" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeInbound" horizontal label="Change Inbound">
                                        <input type="checkbox" id="changeInbound" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="copyUser" horizontal label="Copy User to another Inbound">
                                        <input type="checkbox" id="copyUser" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="setFirstConnectionAsCreateDate" horizontal label="Set first connect as create date">
                                        <input type="checkbox" id="setFirstConnectionAsCreateDate" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="dailyUsage" horizontal label="Daily Usage">
                                        <input type="checkbox" id="dailyUsage" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="logs" horizontal label="Logs">
                                        <input type="checkbox" id="logs" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeExpireDays" horizontal label="Change Expire Days">
                                        <input type="checkbox" id="changeExpireDays" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeMaxConnections" horizontal label="Change Max Connections">
                                        <input type="checkbox" id="changeMaxConnections" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="changeBandwidth" horizontal label="Change Bandwidth">
                                        <input type="checkbox" id="changeBandwidth" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="otherNodes" horizontal label="Other Nodes">
                                        <input type="checkbox" id="otherNodes" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="traffics" horizontal label="Traffic Usage">
                                        <input type="checkbox" id="traffics" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        <FieldObject path={'home'}>
                            <div className="col-span-4 border-t-[1px] p-2">
                                <span className="block font-bold">Home</span>
                                <div className="grid grid-cols-5 gap-x-2">
                                    <Field htmlFor="show" horizontal label="Show">
                                        <input type="checkbox" id="show" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="traffics" horizontal label="Traffics">
                                        <input type="checkbox" id="traffics" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="users" horizontal label="Clients">
                                        <input type="checkbox" id="users" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="servers" horizontal label="Servers">
                                        <input type="checkbox" id="servers" className={styles.input}/>
                                    </Field>
                                    <Field htmlFor="transactions" horizontal label="Transactions">
                                        <input type="checkbox" id="transactions" className={styles.input}/>
                                    </Field>
                                </div>
                            </div>
                        </FieldObject>
                        </> : null }
                    </FieldObject>
                </Tabs.Tab>
            </Tabs>
        </FieldsGroup>
        <div className="flex flex-row pt-2 gap-x-2 text-sm border-t-[1px] mt-2 justify-end">
            <button type="submit" className={styles.buttonItem}>
                { isNew ? <PlusIcon className="w-4"/> : <PencilIcon className="w-4"/> }
                { isNew ? 'Add' : 'Edit' } User
            </button>
        </div>
    </Dialog>
}