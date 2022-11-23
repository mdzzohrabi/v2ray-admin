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
            <div className="flex flex-row">
                <Field htmlFor="tag" label="Tag">
                    <input type="text" id="tag" className={styles.input}/>
                </Field>
                <Field htmlFor="type" label="Type">
                    <input type="text" readOnly id="tag" className={styles.input}/>
                </Field>
                <Field label="Network" className="flex-1" htmlFor="network">
                    <select id="network" className={styles.input}>
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                        <option value="tcp/udp">TCP/UDP</option>
                    </select>
                </Field>
            </div>
            <div className="flex flex-row pt-2">
                <Field label="Send Through" htmlFor="sendThrough" className="flex-1">
                    <input type="text" id="sendThrough" className={styles.input} placeholder={"127.0.0.1"}/>
                </Field>
            </div>
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
                    rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={ip => users.updateItem(row, ip)}>{children}</FieldsGroup>}
                />                         
            </> }
            </Collection>
            </FieldsGroup>
            <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
                <button onClick={ok} className={styles.button}>Edit Rule</button>
            </div>
    </Dialog>
}
