// @ts-check

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
    let [username, setUsername] = useState('');
    let [protocol, setProtocol] = useState('');

    const addUser = useCallback(async (e) => {
        e?.preventDefault();
        try {
            setLoading?.call(this, true);
            let result = await serverRequest(context.server, '/user', {
                email: username, protocol
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

    return <div className="flex my-3 text-sm">
        <h2 className="font-bold px-3 py-3 whitespace-nowrap">Add User</h2>
        <div className="self-center flex-nowrap flex">
            <form onSubmit={addUser}>
            <label htmlFor="userName" className="px-3 self-center">Username</label>
            <input value={username} onChange={(e) => setUsername(e.currentTarget.value)} disabled={disabled} className="border-gray-500 border-solid border-2 rounded-md" type="text" id="userName"/>

            <label htmlFor="protocol" className="px-3 self-center">Protocol</label>
            {/* <input value={protocol} onChange={(e) => setProtocol(e.currentTarget.value)} disabled={disabled} className="border-gray-500 border-solid border-2 rounded-md" type="text" id="protocol"/> */}
            <select value={protocol} disabled={disabled} id="protocol" onChange={e => setProtocol(e.currentTarget.value)} className="border-gray-500 border-solid border-2 rounded-md">
                <option key={"no-protocol"} value={undefined}>-</option>
                {protocols?.map(p => <option key={"protocol-" + p} value={p}>{p}</option>)}
            </select>

            <button disabled={disabled} type="submit" className="bg-slate-300 whitespace-nowrap rounded-lg px-3 py-1 ml-2 duration-100 hover:bg-blue-300">Add User</button>
            {/* { message || error ?
            <div className={classNames("message px-3 py-2 bg-slate-100 mt-2 rounded-md text-sm", { 'bg-red-100': !!error })}>{message || error}</div> : null } */}
            </form>
        </div>
    </div>
}