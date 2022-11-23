// @ts-check

import classNames from "classnames";
import React from "react";
import { useState, useCallback } from "react";
import { styles } from "../../styles";
import { Dialog } from "../dialog";
import { Collection, Field, FieldsGroup } from "../fields";
import { PopupMenu } from "../popup-menu";
import { Table } from "../table";

/**
 * 
 * @param {{ outbound: V2RayConfigOutbound, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
export function OutboundEditor({ outbound: outboundProp, dissmis, onEdit }) {
    let [outbound, setOutbound] = useState({ protocol: 'http', ...outboundProp });
    let ok = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(outboundProp, outbound);
        dissmis();
    }, [onEdit, outbound, dissmis]);

    return <Dialog onClose={dissmis} onSubmit={ok} title="Outbound">
        <FieldsGroup data={outbound} dataSetter={setOutbound}>
            <div className="flex flex-row">
                <Field htmlFor="tag" label="Tag">
                    <input type="text" id="tag" className={styles.input}/>
                </Field>
                <Field label="Protocol" className="flex-1" htmlFor="protocol">
                    <select id="protocol" className={styles.input}>
                        <option value="http">HTTP</option>
                        <option value="vmess">VMess</option>
                        <option value="vless">VLess</option>
                        <option value="blackhole">Blackhole</option>
                        <option value="dns">DNS</option>
                        <option value="freedom">Freedom</option>
                        <option value="mtproto">MTProto</option>
                        <option value="socks">SOCKS</option>
                        <option value="shadowsocks">Shadowsocks</option>
                    </select>
                </Field>
            </div>
            <div className="flex flex-row pt-2">
                <Field label="Send Through" htmlFor="sendThrough" className="flex-1">
                    <input type="text" id="sendThrough" className={styles.input} placeholder={"127.0.0.1"}/>
                </Field>
            </div>
            {outbound?.protocol == 'http' ?
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Settings (HTTP)</h3>
                <div className="flex flex-col">
                    {/* <FieldsGroup data={outbound?.settings} dataSetter={settings => setOutbound({ ...outbound, settings })}>
                        <Field label="Proxy Tag" htmlFor="tag" className="flex-1">
                            <input className={styles.input} type="text" id="tag" placeholder="Proxy Tag" />
                        </Field>
                    </FieldsGroup> */}
                    <Collection data={outbound?.settings?.servers ?? []} dataSetter={servers => setOutbound({ ...outbound, settings: { ...outbound.settings, servers } })}>
                    {servers => <>
                        <div className="flex flex-row items-center px-2">
                            <label className={classNames(styles.label, "flex-1")}>Servers</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => servers.addItem(null, {})} className={styles.addButtonSmall}>+ Add Server</button>
                            </div>
                        </div>
                        <Table
                            rows={servers.items ?? []}
                            columns={[ 'Address', 'Port', 'Users', 'Action' ]}
                            cells={row => [
                                // Address
                                <Field htmlFor="address"><input type="text" id="address" className={styles.input} placeholder={"0.0.0.0"}/></Field>,
                                // Port
                                <Field htmlFor="port"><input type="text" id="port" className={styles.input} placeholder={"80"}/></Field>,
                                // Users
                                <Collection data={row.users ?? []} dataSetter={users => servers.updateItem(row, { ...row, users })}>
                                    {users => <>
                                        {users.items.map(user => <FieldsGroup data={user} dataSetter={edit => users.updateItem(user, edit)}>
                                            <div className="flex flex-row border-b-[1px] pb-2 last-of-type:border-b-0 text-xs items-center">
                                                <Field htmlFor="username" label="Username">
                                                    <input type="text" className={styles.input} id="username"/>
                                                </Field>
                                                <Field htmlFor="password" label="Password">
                                                    <input type="text" className={styles.input} id="password"/>
                                                </Field>
                                                <span onClick={() => users.deleteItem(user)} className={styles.link}>Delete</span>
                                            </div>
                                        </FieldsGroup>)}
                                        <span onClick={() => users.addItem(null, {})} className={styles.link}>+ Add User</span>
                                    </>}
                                </Collection>,
                                // Actions
                                <PopupMenu>
                                    <PopupMenu.Item action={() => servers.deleteItem(row)} >Delete</PopupMenu.Item>
                                </PopupMenu>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={server => servers.updateItem(row, server)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
                </div>
            </div> : null }
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                    Stream settings
                    {!!outbound?.proxySettings?.tag ? <span className="italic text-gray-500 ml-2 text-xs px-2 py-1 rounded-lg bg-yellow-100">Ignored because of Proxy</span> : null }
                </h3>
                <div className="flex flex-row">
                    <Field label="Network" htmlFor="network" className="flex-1" data={outbound?.streamSettings ?? {}} dataSetter={streamSettings => setOutbound({ ...outbound, streamSettings })}>
                        <select className={styles.input} id="network">
                            <option value="tcp">TCP</option>
                            <option value="kcp">KCP</option>
                            <option value="http">HTTP</option>
                            <option value="domainsocket">DomainSocket</option>
                            <option value="quic">Quic</option>
                            <option value="ws">WebSocket</option>
                        </select>
                    </Field>
                    <Field label="Security" htmlFor="security" data={outbound?.streamSettings ?? {}} dataSetter={streamSettings => setOutbound({ ...outbound, streamSettings })}>
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field>
                </div>
            </div>
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Proxy settings</h3>
                <div className="flex flex-row">
                    <Field label="Proxy Tag" htmlFor="tag" className="flex-1" data={outbound?.proxySettings ?? {}} dataSetter={proxySettings => setOutbound({ ...outbound, proxySettings })}>
                        <input className={styles.input} type="text" id="tag" placeholder="Proxy Tag" />
                    </Field>
                    {/* <Field label="Security" htmlFor="security" data={outbound?.proxySettings ?? {}} dataSetter={proxySettings => setOutbound({ ...outbound, proxySettings })}>
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field> */}
                </div>
            </div>
            </FieldsGroup>
            <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
                <button onClick={ok} className={styles.button}>Edit Outbound</button>
            </div>
    </Dialog>
}
