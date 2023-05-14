import { Dialog } from "@common/components/dialog";
import { FieldsGroup, Field, Collection, FieldObject } from "@common/components/fields";
import { PopupMenu } from "@common/components/popup-menu";
import { Select } from "@common/components/select";
import { Table } from "@common/components/table";
import classNames from "classnames";
import { useCallback, useState } from "react";
import { V2RayConfigOutbound } from "../../../../types";
import { styles } from "../../lib/styles";

/**
 * 
 * @param {{ outbound: V2RayConfigOutbound, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
export function OutboundEditor({ outbound: outboundProp, dissmis, onEdit }) {
    let [outbound, setOutbound] = useState<V2RayConfigOutbound>({ protocol: 'http', ...outboundProp });

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
                    </select>
                </Field>
            </div>
            <div className="flex flex-row pt-2">
                <Field label="Send Through" htmlFor="sendThrough" className="flex-1">
                    <input type="text" id="sendThrough" className={styles.input} placeholder={"127.0.0.1"}/>
                </Field>
            </div>
            {outbound?.protocol == 'freedom' ?
            <div className="flex flex-row pt-2">
                <FieldsGroup data={outbound.settings ?? {}} dataSetter={settings => setOutbound({ ...outbound, settings })}>
                    <Field label="User Level" htmlFor="userLevel" className="flex-1">
                        <input type="number" id="userLevel" className={styles.input} placeholder={"0"}/>
                    </Field>
                    <Field label="Redirect" htmlFor="redirect" className="flex-1">
                        <input type="text" id="redirect" className={styles.input} placeholder={"127.0.0.1:80"}/>
                    </Field>
                    <Field label="Domain Strategy" htmlFor="domainStrategy">
                        <select className={styles.input} id="domainStrategy">
                            <option value="">-</option>
                            <option value="AsIs">AsIs</option>
                            <option value="IPIfNonMatch">IPIfNonMatch</option>
                            <option value="IPOnDemand">IPOnDemand</option>
                        </select>
                    </Field>
                </FieldsGroup>
            </div> : null }
            {outbound?.protocol == 'blackhole' ?
            <div className="flex flex-row pt-2">
                <FieldsGroup data={outbound.settings?.response ?? {}} dataSetter={response => setOutbound({ ...outbound, settings: { ...outbound.settings, response } })}>
                    <Field label="Response Type" htmlFor="type">
                        <select className={styles.input} id="type">
                            <option value="">-</option>
                            <option value="none">None</option>
                            <option value="http">HTTP</option>
                        </select>
                    </Field>
                </FieldsGroup>
            </div> : null }
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
                        <div className="flex flex-row items-center px-2 py-2">
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
                                <Field htmlFor="port"><input type="number" id="port" className={styles.input} placeholder={"80"}/></Field>,
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
            {outbound?.protocol == 'vmess' || outbound?.protocol == 'vless' ?
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Settings ({outbound?.protocol?.toUpperCase()})</h3>
                <div className="flex flex-col">
                    {/* <FieldsGroup data={outbound?.settings} dataSetter={settings => setOutbound({ ...outbound, settings })}>
                        <Field label="Proxy Tag" htmlFor="tag" className="flex-1">
                            <input className={styles.input} type="text" id="tag" placeholder="Proxy Tag" />
                        </Field>
                    </FieldsGroup> */}
                    <Collection data={outbound?.settings?.vnext ?? []} dataSetter={vnext => setOutbound({ ...outbound, settings: { ...outbound.settings, vnext } })}>
                    {vnext => <>
                        <div className="flex flex-row items-center px-2 py-2">
                            <label className={classNames(styles.label, "flex-1")}>VNext</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => vnext.addItem(null, {})} className={styles.addButtonSmall}>+ Add VNext Server</button>
                            </div>
                        </div>
                        <Table
                            rows={vnext.items ?? []}
                            columns={[ 'Address', 'Port', 'Users', 'Action' ]}
                            cells={row => [
                                // Address
                                <Field htmlFor="address"><input type="text" id="address" className={styles.input} placeholder={"0.0.0.0"}/></Field>,
                                // Port
                                <Field htmlFor="port"><input type="number" id="port" className={styles.input} placeholder={"80"}/></Field>,
                                // Users
                                <Collection data={row.users ?? []} dataSetter={users => vnext.updateItem(row, { ...row, users })}>
                                    {users => <>
                                        {users.items.map(user => <FieldsGroup data={user} dataSetter={edit => users.updateItem(user, edit)}>
                                            <div className="flex flex-col border-b-[1px] pb-2 last-of-type:border-b-0 text-xs ">
                                                <Field htmlFor="id" label="ID">
                                                    <input type="text" className={styles.input} id="id"/>
                                                </Field>
                                                <Field htmlFor="flow" label="Flow">
                                                    <Select id="flow" items={[
                                                        'none', 'xtls-rprx-vision'
                                                    ]} allowNull={true} nullText='None'/>
                                                </Field>
                                                <Field htmlFor="encryption" label="Encryption">
                                                    <input type="text" className={styles.input} placeholder='none' id="encryption"/>
                                                </Field>
                                                <Field htmlFor="alterId" label="Alter ID">
                                                    <input type="number" className={styles.input} id="alterId" placeholder="0"/>
                                                </Field>
                                                <Field htmlFor="level" label="Level">
                                                    <input type="number" className={styles.input} id="level" placeholder="0"/>
                                                </Field>
                                                <Field htmlFor="security" label="Security">
                                                    <select className={styles.input} id="security">
                                                        <option value="">-</option>
                                                        <option value="auto">auto</option>
                                                        <option value="aes-128-gcm">aes-128-gcm</option>
                                                        <option value="chacha20-poly1305">chacha20-poly1305</option>
                                                        <option value="none">none</option>
                                                    </select>
                                                </Field>
                                                <span onClick={() => users.deleteItem(user)} className={styles.link}>Delete</span>
                                            </div>
                                        </FieldsGroup>)}
                                        <span onClick={() => users.addItem(null, {})} className={styles.link}>+ Add User</span>
                                    </>}
                                </Collection>,
                                // Actions
                                <PopupMenu>
                                    <PopupMenu.Item action={() => vnext.deleteItem(row)} >Delete</PopupMenu.Item>
                                </PopupMenu>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={vnextItem => vnext.updateItem(row, vnextItem)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
                </div>
            </div> : null }
            {outbound?.protocol == 'mtproto' ?
            <>
                <Collection data={outbound?.settings?.users ?? []} dataSetter={users => setOutbound({ ...outbound, settings: { ...outbound.settings, users } })}>
                    {users => <>
                        <div className="flex flex-row items-center px-2 py-2">
                            <label className={classNames(styles.label, "flex-1")}>Users</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => users.addItem(null, {})} className={styles.addButtonSmall}>+ Add User</button>
                            </div>
                        </div>
                        <Table
                            rows={users.items ?? []}
                            columns={[ 'Secret', 'Action' ]}
                            cells={row => [
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
            <FieldObject path={'streamSettings'}>
                <div className="flex flex-col">
                    <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                        Stream settings
                        {!!outbound?.proxySettings?.tag ? <span className="italic text-gray-500 ml-2 text-xs px-2 py-1 rounded-lg bg-yellow-100">Ignored because of Proxy</span> : null }
                    </h3>
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
                                <option value="reality">REALITY</option>
                            </select>
                        </Field>
                    </div>
                    {outbound?.streamSettings?.security == 'reality' ? <>
                        <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                            REALITY settings
                        </h3>
                        <FieldObject path={'realitySettings'}>
                        <div className="flex flex-row">
                            <Field label="Server Name" htmlFor="serverName" className="flex-1">
                                <input type={'text'} className={styles.input} id="serverName"/>
                            </Field>
                            <Field label="Fingerprint" htmlFor="fingerprint">
                                <input type={'text'} placeholder='chrome' className={styles.input} id="fingerprint"/>
                            </Field>
                            <Field label="Show" htmlFor="show" className="py-2 mx-2">
                                <input type={'checkbox'} className={styles.input} id="show"/>
                            </Field>
                        </div>
                        <Field label="Public Key" htmlFor="publicKey" className="flex-1">
                            <input type={'text'} className={styles.input} id="publicKey"/>
                        </Field>
                        <div className="flex flex-row">
                            <Field label="Short Id" htmlFor="shortId" className="flex-1">
                                <input type={'text'} className={styles.input} id="shortId"/>
                            </Field>
                            <Field label="SpiderX" htmlFor="spiderX" className="flex-1">
                                <input type={'text'} className={styles.input} id="spiderX"/>
                            </Field>
                        </div>
                        </FieldObject>
                    </> : null}
                    {outbound?.streamSettings?.security == 'tls' ? <>
                        <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                            TLS settings
                        </h3>
                        <FieldObject path={'tlsSettings'}>
                        <div className="flex flex-row">
                            <Field label="Server Name (SNI)" htmlFor="serverName" className="flex-1">
                                <input type={'text'} className={styles.input} id="serverName"/>
                            </Field>
                            <Field label="Allow Insecure" htmlFor="allowInsecure" className="py-2 mx-2">
                                <input type={'checkbox'} className={styles.input} id="allowInsecure"/>
                            </Field>
                        </div>
                        </FieldObject>
                    </> : null}
                    {outbound?.streamSettings?.network == 'ws' ? <>
                        <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                            WS settings
                        </h3>
                        <FieldObject path={'wsSettings'}>
                        <div className="flex flex-row">
                            <Field label="Path" htmlFor="path">
                                <input type={'text'} className={styles.input} id="path"/>
                            </Field>
                            <FieldObject path={'headers'}>
                                <Field label="Host" htmlFor="host" className="flex-1">
                                    <input type={'text'} className={styles.input} id="host"/>
                                </Field>
                            </FieldObject>
                        </div>
                        </FieldObject>
                    </> : null}
                    {outbound?.streamSettings?.network=='tcp'? <>
                        <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                            TCP settings
                        </h3>
                        <div className="flex flex-row">
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
                                    <Field label="Request Path" className="flex-1" htmlFor="path">
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
                    </div> 
                    </>
                    : null}
                </div>                        
            </FieldObject>
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
