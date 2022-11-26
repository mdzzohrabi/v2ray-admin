// @ts-check

import { useRouter } from "next/router";
import React, { useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";
import { AppContext } from "./app-context";
import { Field, FieldsGroup } from "./fields";

/**
 * 
 * @param {{
 *      onRefresh?: Function,
 *      setLoading?: Function,
 *      protocols?: string[],
 *      disabled?: boolean,
 *      className?: string
 * }} param0 Parameters
 */
export function AddUser({ disabled = false, onRefresh, setLoading, protocols, className = '' }) {

    const context = useContext(AppContext);
    const router = useRouter();
    let showAll = router.query.all == '1';

    /**
     * @type {[
     *      {email?: string, fullName?: string, mobile?: string, emailAddress?: string, protocol?: string, free?: boolean, private?: boolean},
     *      React.Dispatch<React.SetStateAction<any>>
     * ]}
     */
    let [user, setUser] = useState({});

    const addUser = useCallback(async (e) => {
        e?.preventDefault();
        try {
            setLoading?.call(this, true);
            let result = await serverRequest(context.server, '/user', {
                ...user
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                setUser({});
                onRefresh?.call(this);
                toast.success("User added successful");
            }
        }
        catch (err) {
            toast.error(err?.message);
        } finally {
            setLoading?.call(this, false);
        }

    }, [user, onRefresh]);

    return <form onSubmit={addUser}>
        <FieldsGroup className={className} title="Add User" containerClassName="items-center" data={user} dataSetter={setUser}>
            <Field label={"Username"} htmlFor="email">
                <input placeholder="user" pattern={showAll ? undefined : '^user[a-z0-9_-]+'} disabled={disabled} className={styles.input} type="text" id="email"/>
            </Field>
            <Field label={"FullName"} htmlFor="fullName">
                <input placeholder="Full Name" disabled={disabled} className={styles.input} type="text" id="fullName"/>
            </Field>
            <Field label={"Mobile"} htmlFor="mobile">
                <input placeholder="09" inputMode={"tel"} disabled={disabled} className={styles.input} type="text" id="mobile"/>
            </Field>
            <Field label={"Email"} htmlFor="emailAddress">
                <input placeholder="Email" inputMode={"email"} disabled={disabled} className={styles.input} type="text" id="emailAddress"/>
            </Field>
            <Field label={"Protocol"} htmlFor="protocol">
                <select disabled={disabled} id="protocol" className={styles.input}>
                    <option key={"no-protocol"} value={undefined}>-</option>
                    {protocols?.map(p => <option key={"protocol-" + p} value={p}>{p}</option>)}
                </select>
            </Field>
            {showAll?
            <Field htmlFor="private" label="Private">
                <input type="checkbox" id="private"/>
            </Field>:null}
            {showAll?
            <Field htmlFor="free" label="Free">
                <input type="checkbox" id="free"/>
            </Field>:null}
            <button disabled={disabled} type="submit" className={styles.button}>Add User</button>
        </FieldsGroup>
    </form>;
}