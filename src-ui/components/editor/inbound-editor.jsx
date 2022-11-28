// @ts-check

import classNames from "classnames";
import React, { useCallback, useState } from "react";
import { styles } from "../../lib/styles";
import { Dialog } from "../dialog";
import { Collection, Field, FieldsGroup } from "../fields";
import { PopupMenu } from "../popup-menu";
import { Table } from "../table";

/**
 * 
 * @param {{ inbound: V2RayConfigInbound, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
export function InboundEditor({ inbound: inboundProp, dissmis, onEdit }) {
    let [inbound, setInbound] = useState({...inboundProp});
    let ok = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(inboundProp, inbound);
        dissmis();
    }, [onEdit, inbound, dissmis, inboundProp]);

    return <Dialog onClose={dissmis} onSubmit={ok} title="Inbound">
        <FieldsGroup data={inbound} dataSetter={setInbound}>
            <div className="flex flex-row">
                <Field htmlFor="tag" label="Tag">
                    <input type="text" id="tag" className={styles.input}/>
                </Field>
                <Field label="Protocol" className="flex-1" htmlFor="protocol">
                    <select id="protocol" className={styles.input}>
                        <option>-</option>
                        <option value="http">HTTP</option>
                        <option value="vmess">VMess</option>
                        <option value="vless">VLess</option>
                        <option value="blackhole">Blackhole</option>
                        <option value="dns">DNS</option>
                        <option value="freedom">Freedom</option>
                        <option value="mtproto">MTProto</option>
                        <option value="socks">SOCKS</option>
                        <option value="shadowsocks">Shadowsocks</option>
                        <option value="dokodemo-door">Dokodemo-door</option>
                    </select>
                </Field>
            </div>
            {inbound?.protocol == 'http' ?
            <>
                <div className="flex flex-row pt-2">
                    <FieldsGroup data={inbound.settings ?? {}} dataSetter={settings => setInbound({ ...inbound, settings })}>
                        <Field label="User Level" htmlFor="userLevel" className="flex-1">
                            <input type="number" id="userLevel" className={styles.input} placeholder={"0"}/>
                        </Field>
                        <Field label="Timeout" htmlFor="timeout" className="flex-1">
                            <input type="number" id="timeout" className={styles.input} placeholder={"0"}/>
                        </Field>
                        <Field label="Allow Transparent" htmlFor="allowTransparent" className="flex-1">
                            <input type="checkbox" id="allowTransparent" className={styles.input}/>
                        </Field>
                    </FieldsGroup>
                </div>
                <Collection data={inbound?.settings?.accounts ?? []} dataSetter={accounts => setInbound({ ...inbound, settings: { ...inbound.settings, accounts } })}>
                    {accounts => <>
                        <div className="flex flex-row items-center px-2 py-2">
                            <label className={classNames(styles.label, "flex-1")}>Accounts</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => accounts.addItem(null, {})} className={styles.addButtonSmall}>+ Add Account</button>
                            </div>
                        </div>
                        <Table
                            rows={accounts.items ?? []}
                            columns={[ 'Username', 'Password', 'Action' ]}
                            cells={row => [
                                <Field htmlFor="user"><input type="text" id="user" className={styles.input}/></Field>,
                                <Field htmlFor="pass"><input type="text" id="pass" className={styles.input}/></Field>,
                                // Actions
                                <span className={styles.link} onClick={() => accounts.deleteItem(row)} >Delete</span>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={account => accounts.updateItem(row, account)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
            </>
             : null }
            {inbound?.protocol == 'mtproto' ?
            <>
                <Collection data={inbound?.settings?.users ?? []} dataSetter={users => setInbound({ ...inbound, settings: { ...inbound.settings, users } })}>
                    {users => <>
                        <div className="flex flex-row items-center px-2 py-2">
                            <label className={classNames(styles.label, "flex-1")}>Users</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => users.addItem(null, {})} className={styles.addButtonSmall}>+ Add User</button>
                            </div>
                        </div>
                        <Table
                            rows={users.items ?? []}
                            columns={[ 'Email', 'Level', 'Secret', 'Action' ]}
                            cells={row => [
                                <Field htmlFor="email"><input type="text" id="email" className={styles.input}/></Field>,
                                <Field htmlFor="level"><input type="number" id="level" className={styles.input}/></Field>,
                                <Field htmlFor="secret"><input type="text" id="secret" className={styles.input}/></Field>,
                                // Actions
                                <span className={styles.link} onClick={() => users.deleteItem(row)} >Delete</span>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={user => users.updateItem(row, user)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
            </>
             : null }
            <div className="flex flex-row pt-2">
                <Field label="Listen" htmlFor="listen" className="flex-1">
                    <input type="text" id="listen" className={styles.input} placeholder={"0.0.0.0"}/>
                </Field>
                <Field label="Port" htmlFor="port">
                    <input type={"number"} id="port" className={styles.input}/>
                </Field>
            </div>
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Stream settings</h3>
                <div className="flex flex-row">
                    <Field label="Network" htmlFor="network" className="flex-1" data={inbound?.streamSettings ?? {}} dataSetter={streamSettings => setInbound({ ...inbound, streamSettings })}>
                        <select className={styles.input} id="network">
                            <option value="tcp">TCP</option>
                            <option value="kcp">KCP</option>
                            <option value="http">HTTP</option>
                            <option value="domainsocket">DomainSocket</option>
                            <option value="quic">Quic</option>
                            <option value="ws">WebSocket</option>
                        </select>
                    </Field>
                    <Field label="Security" htmlFor="security" data={inbound?.streamSettings ?? {}} dataSetter={streamSettings => setInbound({ ...inbound, streamSettings })}>
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field>
                </div>
            </div>
            </FieldsGroup>
            <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
                <button onClick={ok} className={styles.button}>Edit Inbound</button>
            </div>
    </Dialog>
}
