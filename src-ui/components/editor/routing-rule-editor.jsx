// @ts-check

import classNames from "classnames";
import React, { useCallback, useState } from "react";
import { styles } from "../../lib/styles";
import { Dialog } from "../dialog";
import { Collection, Field, FieldsGroup } from "../fields";
import { Table } from "../table";
import { Tabs } from "../tabs";

/**
 * 
 * @param {{ rule: V2RayConfigRoutingRule, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
export function RoutingRuleEditor({ rule: ruleProp, dissmis, onEdit }) {
    let [rule, setRule] = useState({ type: 'field', ...ruleProp });
    let ok = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(ruleProp, rule);
        dissmis();
    }, [onEdit, rule, dissmis]);

    return <Dialog onClose={dissmis} onSubmit={ok} title="Routing Rule">
        <FieldsGroup data={rule} dataSetter={setRule}>
            <Tabs>
                <Tabs.Tab title="Rule">
                    <div className="flex flex-row">
                        <Field htmlFor="tag" label="Tag">
                            <input type="text" id="tag" className={styles.input}/>
                        </Field>
                        <Field htmlFor="type" label="Type">
                            <input type="text" readOnly id="tag" className={styles.input}/>
                        </Field>
                        <Field label="Domain Matcher" htmlFor="domainMatcher">
                            <select className={styles.input} id="domainMatcher">
                                <option>-</option>
                                <option value="linear">Linear</option>
                                <option value="mph">MPH</option>
                            </select>
                        </Field>
                    </div>
                    <div className="flex flex-row pt-2">
                        <Field label="Network" className="flex-1" htmlFor="network">
                            <select id="network" className={styles.input}>
                                <option>-</option>
                                <option value="tcp">TCP</option>
                                <option value="udp">UDP</option>
                                <option value="tcp/udp">TCP/UDP</option>
                            </select>
                        </Field>
                        <Field label="Source Port" htmlFor="sourcePort" className="flex-1">
                            <input type="text" id="sourcePort" className={styles.input} placeholder={"100-200"}/>
                        </Field>
                        <Field label="Port" htmlFor="port" className="flex-1">
                            <input type="text" id="port" className={styles.input} placeholder={"100-200"}/>
                        </Field>
                        {/* <Field label="Send Through" htmlFor="sendThrough" className="flex-1">
                            <input type="text" id="sendThrough" className={styles.input} placeholder={"127.0.0.1"}/>
                        </Field> */}
                    </div>
                    <div className="flex flex-row pt-2">
                        <Field label="Protocol" className="flex-1" htmlFor="protocol">
                            <input type={"text"} id="protocol" placeholder="vmess" className={styles.input}/>
                        </Field>
                        <Field label="Attributes" htmlFor="attrs" className="flex-1">
                            <input type="text" id="attrs" className={styles.input}/>
                        </Field>
                    </div>
                    <div className="flex flex-row pt-2">
                        <Field label="Inbound Tag" className="flex-1" htmlFor="inboundTag">
                            <input type={"text"} id="inboundTag" placeholder="direct" className={styles.input}/>
                        </Field>
                        <Field label="Outbound Tag" className="flex-1" htmlFor="outboundTag">
                            <input type={"text"} id="outboundTag" placeholder="direct" className={styles.input}/>
                        </Field>
                        <Field label="Balancer Tag" className="flex-1" htmlFor="balancerTag">
                            <input type={"text"} id="balancerTag" placeholder="direct" className={styles.input}/>
                        </Field>
                    </div>
                </Tabs.Tab>
                <Tabs.Tab title="IPs">
                    <Collection data={rule.ip ?? []} dataSetter={ip => setRule({ ...rule, ip })}>
                    {ips => <>
                        <div className="flex flex-row items-center px-2">
                            <label className={classNames(styles.label, "flex-1")}>IPs</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => ips.addItem(null, '0.0.0.0')} className={styles.addButtonSmall}>+ Add IP</button>
                            </div>
                        </div>
                        <Table
                            rows={ips.items ?? []}
                            columns={[ 'Address', 'Action' ]}
                            cells={row => [
                                // Address
                                <Field htmlFor="address"><input type="text" id="address" className={styles.input} placeholder={"0.0.0.0"}/></Field>,
                                // Actions
                                <span className={styles.link} onClick={() => ips.deleteItem(row)} >Delete</span>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={ip => ips.updateItem(row, ip)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
                </Tabs.Tab>
                <Tabs.Tab title="Users">
                    <Collection data={rule.user ?? []} dataSetter={user => setRule({ ...rule, user })}>
                    {users => <>
                        <div className="flex flex-row items-center px-2">
                            <label className={classNames(styles.label, "flex-1")}>Users</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => users.addItem(null, '')} className={styles.addButtonSmall}>+ Add User</button>
                            </div>
                        </div>
                        <Table
                            rows={users.items ?? []}
                            columns={[ 'User', 'Action' ]}
                            cells={row => [
                                // Address
                                <Field htmlFor="user"><input type="text" id="user" className={styles.input} placeholder={""}/></Field>,
                                // Actions
                                <span className={styles.link} onClick={() => users.deleteItem(row)} >Delete</span>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={user => users.updateItem(row, user)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
                </Tabs.Tab>
                <Tabs.Tab title="Domains">
                    <Collection data={rule.domains ?? []} dataSetter={domains => setRule({ ...rule, domains })}>
                    {domains => <>
                        <div className="flex flex-row items-center px-2">
                            <label className={classNames(styles.label, "flex-1")}>Domains</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => domains.addItem(null, '')} className={styles.addButtonSmall}>+ Add Domain</button>
                            </div>
                        </div>
                        <Table
                            rows={domains.items ?? []}
                            columns={[ 'Domain', 'Action' ]}
                            cells={row => [
                                // Address
                                <Field htmlFor="domain"><input type="text" id="domain" className={styles.input} placeholder={""}/></Field>,
                                // Actions
                                <span className={styles.link} onClick={() => domains.deleteItem(row)} >Delete</span>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={domain => domains.updateItem(row, domain)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
                </Tabs.Tab>
            </Tabs>
        </FieldsGroup>
        <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
            <button onClick={dissmis} className={styles.button}>Cancel</button>
            <button onClick={ok} className={styles.buttonPrimary}>Edit Rule</button>
        </div>
    </Dialog>
}
