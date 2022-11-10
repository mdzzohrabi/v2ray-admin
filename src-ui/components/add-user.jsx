// @ts-check

import { useRouter } from "next/router";
import React, { useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";
import { serverRequest } from "../util";
import { AppContext } from "./app-context";

/**
 * 
 * @param {{
 *      onRefresh?: Function,
 *      setLoading?: Function,
 *      protocols?: string[],
 *      disabled?: boolean
 * }} param0 Parameters
 */
export function AddUser({ disabled = false, onRefresh, setLoading, protocols }) {

    const context = useContext(AppContext);
    const router = useRouter();
    let showAll = router.query.all == '1';
    let [username, setUsername] = useState('');
    let [fullName, setFullName] = useState('');
    let [mobile, setMobile] = useState('');
    let [emailAddress, setEmailAddress] = useState('');
    let [protocol, setProtocol] = useState('');

    const addUser = useCallback(async (e) => {
        e?.preventDefault();
        try {
            setLoading?.call(this, true);
            let result = await serverRequest(context.server, '/user', {
                email: username?.toLowerCase(), protocol
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                setUsername('');
                onRefresh?.call(this);
                toast.success("User added successful");
            }
        }
        catch (err) {
            toast.error(err?.message);
        } finally {
            setLoading?.call(this, false);
        }

    }, [username, protocol, onRefresh]);

    let inputClass = "border-gray-500 border-solid border-b-0 bg-slate-100 rounded-md invalid:border-red-500 invalid:ring-red-600 px-2 py-1 focus:outline-blue-500";
    let labelClass = "py-1 self-start font-semibold";

    return <div className="flex my-3 text-sm overflow-auto">
        <h2 className="font-bold px-3 py-3 whitespace-nowrap">Add User</h2>
        <div className="self-center">
            <form onSubmit={addUser} className="flex flex-row">

            <div className="flex flex-col px-1">
                <label htmlFor="userName" className={labelClass}>Username</label>
                <input placeholder="user" pattern={showAll ? '' : '^user[a-z0-9_-]+'} value={username} onChange={(e) => setUsername(e.currentTarget.value)} disabled={disabled} className={inputClass} type="text" id="userName"/>
            </div>

            <div className="flex flex-col px-1">
                <label htmlFor="fullName" className={labelClass}>FullName</label>
                <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} disabled={disabled} className={inputClass} type="text" id="fullName"/>
            </div>

            <div className="flex flex-col px-1">
                <label htmlFor="mobile" className={labelClass}>Mobile</label>
                <input placeholder="09" value={mobile} inputMode={"tel"} onChange={(e) => setMobile(e.currentTarget.value)} disabled={disabled} className={inputClass} type="text" id="mobile"/>

            </div>

            <div className="flex flex-col px-1">
                <label htmlFor="emailAddress" className={labelClass}>Email</label>
                <input placeholder="Email" value={emailAddress} inputMode={"email"} onChange={(e) => setEmailAddress(e.currentTarget.value)} disabled={disabled} className={inputClass} type="text" id="emailAddress"/>
            </div>

            <div className="flex flex-col px1">
                <label htmlFor="protocol" className={labelClass}>Protocol</label>
                <select value={protocol} disabled={disabled} id="protocol" onChange={e => setProtocol(e.currentTarget.value)} className={inputClass}>
                    <option key={"no-protocol"} value={undefined}>-</option>
                    {protocols?.map(p => <option key={"protocol-" + p} value={p}>{p}</option>)}
                </select>
            </div>

            <button disabled={disabled} type="submit" className="bg-slate-200 whitespace-nowrap rounded-lg px-5 py-1 ml-2 duration-100 hover:bg-blue-300">Add User</button>
            {/* { message || error ?
            <div className={classNames("message px-3 py-2 bg-slate-100 mt-2 rounded-md text-sm", { 'bg-red-100': !!error })}>{message || error}</div> : null } */}
            </form>
        </div>
    </div>
}