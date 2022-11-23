// @ts-check

import React, { useState, useCallback } from "react";
import { styles } from "../../styles";
import { Dialog } from "../dialog";
import { FieldsGroup, Field } from "../fields";

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
