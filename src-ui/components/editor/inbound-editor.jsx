// @ts-check

import classNames from "classnames";
import React, { useCallback, useState } from "react";
import { useContext } from "react";
import useSWR from "swr";
import { styles } from "../../lib/styles";
import { serverRequest } from "../../lib/util";
import { AppContext } from "../app-context";
import { Dialog } from "../dialog";
import { Collection, Field, FieldObject, FieldsGroup } from "../fields";
import { PopupMenu } from "../popup-menu";
import { Table } from "../table";

/**
 * 
 * @param {{ inbound: V2RayConfigInbound, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
export function InboundEditor({ inbound: inboundProp, dissmis, onEdit }) {
    let [inbound, setInbound] = useState({...inboundProp});
    let context = useContext(AppContext);

    let ok = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(inboundProp, inbound);
        dissmis();
    }, [onEdit, inbound, dissmis, inboundProp]);

    /**
     * @type {import("swr").SWRResponse<ServerNode[]>}
     */
    let {data: nodes} = useSWR('/nodes', serverRequest.bind(this, context?.server));

    console.log(nodes, context);

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
             {inbound?.protocol == 'dokodemo-door' ?
            <>
                <FieldObject path={'settings'}>
                    <Field label="Address" htmlFor="address">
                        <input type="text" id="address" className={styles.input}/>
                    </Field> 
                </FieldObject>
            </>
             : null }
            <div className="flex flex-row pt-2">
                <Field label="Listen" htmlFor="listen" className="flex-1">
                    <input type="text" id="listen" className={styles.input} placeholder={"0.0.0.0"}/>
                </Field>
                <Field label="Port" htmlFor="port">
                    <input type={"number"} id="port" className={styles.input}/>
                </Field>
                <Field label="Users Server Node" htmlFor="usersServerNode">
                    <select id="usersServerNode" className={styles.input}>
                        <option value={''}>-</option>
                        {nodes?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                </Field>
            </div>
            {/* {inbound?.protocol == 'vmess' || inbound?.protocol == 'vless' ?
            <div className="flex flex-row pt-2">
                <FieldObject path={"settings"}>
                    <Field label="Decryption" htmlFor="decryption" className="flex-1">
                        <input type="text" id="decryption" className={styles.input} placeholder={"none"}/>
                    </Field>
                </FieldObject>
            </div> : null } */}
            <div className="flex flex-col">
                <FieldObject path={"streamSettings"}>
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Stream settings</h3>
                <div className="flex flex-row">
                    <Field label="Network" htmlFor="network" className="flex-1">
                        <select className={styles.input} id="network">
                            <option value="">-</option>
                            <option value="tcp">TCP</option>
                            <option value="kcp">KCP</option>
                            <option value="http">HTTP</option>
                            <option value="domainsocket">DomainSocket</option>
                            <option value="quic">Quic</option>
                            <option value="ws">WebSocket</option>
                        </select>
                    </Field>
                    <Field label="Security" htmlFor="security">
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field>
                </div>
                {inbound?.streamSettings?.network=='tcp'? <div className="flex flex-row">
                        <FieldObject path={'tcpSettings'}>
                            <FieldObject path={'header'}>
                                <Field label="Header Type" htmlFor="type">
                                    <select className={styles.input} id="type">
                                        <option value="">-</option>
                                        <option value="none">None</option>
                                        <option value="http">HTTP</option>
                                    </select>
                                </Field>
                                <FieldObject path={'request'}>
                                    <Field label="Request Method" htmlFor="method">
                                        <input type="text" id="method" className={styles.input}/>
                                    </Field>                                    
                                    <Field label="Request Path" htmlFor="path">
                                        <input type="text" id="method" className={styles.input}/>
                                    </Field>
                                    {/* <ObjectCollection path="headers">{headers => {
                                        <>
                                        <div className="flex flex-row items-center px-2">
                                            <label className={classNames(styles.label, "flex-1", "font-bold text")}>Headers</label>
                                            <div className="items-center">
                                                <button type={"button"} onClick={() => headers.setKey(Math.round(Math.random() * 10000).toString(), {})} className={styles.addButtonSmall}>+ Add Policy</button>
                                            </div>
                                        </div>
                                        <Table
                                            rows={Object.keys(headers.value ?? {}).map(key => ({ key, ...(headers.value ?? {})[key] }))}
                                            columns={[ 'Header', 'Value', 'Action' ]}
                                            cells={row => [
                                                <Editable value={row.key} onEdit={newKey => {
                                                    headers.renameKey(row.key, newKey);
                                                }}>
                                                    {row.key}
                                                </Editable>,
                                                <Field htmlFor="handshake" label="Handshake"><input type="number" id="handshake" className={styles.input} placeholder={"4"}/></Field>,
                                                // Actions
                                                <span className={styles.link} onClick={() => headers.deleteKey(row.key)}>Delete</span>
                                            ]}
                                            rowContainer={(row, children) => <FieldsGroup data={withoutKey(row, 'key')} dataSetter={level => headers.setKey(row.key, level)}>{children}</FieldsGroup>}
                                        />
                                    </>
                                    }}</ObjectCollection> */}
                                </FieldObject>
                            </FieldObject>
                        </FieldObject>
                    </div> : null}
                    {inbound?.streamSettings?.security=='tls'? <div className="flex flex-col flex-1">
                        <Collection data={inbound?.streamSettings?.tlsSettings?.certificates ?? []} dataSetter={certificates => setInbound({
                            ...inbound,
                            streamSettings: {
                                ...(inbound.streamSettings ?? {}),
                                tlsSettings: {
                                    ...(inbound.streamSettings?.tlsSettings ?? {}),
                                    certificates
                                }
                            }
                        })}>
                        {certificates => <>
                            <div className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 flex flex-row">
                                <h3 className="font-semibold flex-1">TLS Settings</h3>
                                <button type={"button"} onClick={() => certificates.addItem(null, {})} className={styles.addButtonSmall}>+ Add Certificate</button>
                            </div>
                            <Table
                            rows={certificates.items ?? []}
                            columns={[ 'Certificate file', 'Key file', 'Action' ]}
                            cells={row => [
                                // Certificate
                                <Field htmlFor="certificateFile"><input type="text" id="certificateFile" className={styles.input} placeholder={"/path/to/certificate.crt"}/></Field>,
                                // Key
                                <Field htmlFor="keyFile"><input type="text" id="keyFile" className={styles.input} placeholder={"/path/to/key.key"}/></Field>,
                                // Actions
                                <PopupMenu>
                                    <PopupMenu.Item action={() => certificates.deleteItem(row)} >Delete</PopupMenu.Item>
                                </PopupMenu>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={certificate => certificates.updateItem(row, certificate)}>{children}</FieldsGroup>}
                        />       
                        </>}
                        </Collection>
                        <Collection data={inbound?.streamSettings?.tlsSettings?.alpn ?? []} dataSetter={alpn => setInbound({
                            ...inbound,
                            streamSettings: {
                                ...(inbound.streamSettings ?? {}),
                                tlsSettings: {
                                    ...(inbound.streamSettings?.tlsSettings ?? {}),
                                    alpn
                                }
                            }
                        })}>
                        {alpns => <>
                            <div className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 flex flex-row">
                                <h3 className="font-semibold flex-1">TLS Alpn Settings</h3>
                                <button type={"button"} onClick={() => alpns.addItem(null, '')} className={styles.addButtonSmall}>+ Add ALPN</button>
                            </div>
                            <Table
                            rows={alpns.items ?? []}
                            columns={[ 'ALPN', 'Action' ]}
                            cells={(alpn, index) => [
                                // Certificate
                                <Field data={alpn} dataSetter={newAlpn => alpns.updateItem(alpn, newAlpn)}><input type="text" className={styles.input} placeholder={"http/1.1"}/></Field>,
                                // Actions
                                <PopupMenu>
                                    <PopupMenu.Item action={() => alpns.deleteItem(alpn)} >Delete</PopupMenu.Item>
                                </PopupMenu>
                            ]}
                        />       
                        </>}
                        </Collection>
                    </div> : null}
                    </FieldObject>
            </div>
            </FieldsGroup>
            <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
                <button onClick={ok} className={styles.button}>Edit Inbound</button>
            </div>
    </Dialog>
}
