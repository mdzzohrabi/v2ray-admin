// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { Fragment, useCallback, useContext, useMemo, useState } from 'react';
import toast from "react-hot-toast";
import useSWR from 'swr';
import { AddUser } from "../components/add-user";
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { Copy } from "../components/copy";
import { DateView } from "../components/date-view";
import { Editable } from "../components/editable";
import { Popup } from "../components/popup";
import { serverRequest } from "../util";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let [isLoading, setLoading] = useState(false);
    let [[sortColumn, sortAsc], setSort] = useState(['', true]);
    let showAll = router.query.all == '1';

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
    let {data: inbounds, mutate: refreshInbounds} = useSWR('/inbounds?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

    // /**
    //  * @type {import("swr").SWRResponse<{ [user: string]: { firstConnect?: Date, lastConnect?: Date }}>}
    //  */
    // let {data: usages} = useSWR('/usages', serverRequest.bind(this, context.server));


    const showQRCode = useCallback(async (protocol, user) => {
        let config = await serverRequest(context.server, '/client_config?protocol=' + protocol, user).then(data => data.config)
        let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(config);
        window.open(link);
    }, [router]);

    const setActive = useCallback(async (protocol, user, active) => {
        let result = await serverRequest(context.server, '/active', {email: user.email, protocol, active});
        if (result?.ok) {
            toast.success('Changes made successful');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot save changes');
        }
    }, [router]);

    const removeUser = useCallback(async (protocol, user) => {
        let result = await serverRequest(context.server, '/remove_user', {email: user.email, protocol});
        if (result?.ok) {
            toast.success('User removed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot remove user');
        }
    }, [router]);

    const setMaxConnection = useCallback(async (protocol, user, value) => {
        let result = await serverRequest(context.server, '/max_connections', {email: user.email, protocol, value});
        if (result?.ok) {
            toast.success('Max connection changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setExpireDays = useCallback(async (protocol, user, value) => {
        let result = await serverRequest(context.server, '/expire_days', {email: user.email, protocol, value});
        if (result?.ok) {
            toast.success('Expire days changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setUsername = useCallback(async (protocol, user, value) => {
        let result = await serverRequest(context.server, '/change_username', {email: user.email, protocol, value});
        if (result?.ok) {
            toast.success('Username changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const reGenerateId = useCallback(async (protocol, user) => {
        let result = await serverRequest(context.server, '/regenerate_id', {email: user.email, protocol});
        if (result?.ok) {
            toast.success('ID generated');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot generate new id');
        }
    }, [router]);

    let headClass = 'px-1 py-2 border-b-2 border-b-blue-900';

    const prompt = useCallback((message, okButton, onClick) => {
        toast.custom(t => {
            return <div className={"ring-1 ring-black ring-opacity-10 whitespace-nowrap max-w-md w-full shadow-md bg-white flex rounded-lg pointer-events-auto px-3 py-2"}>
                <span className="flex-1 self-center">{message}</span>
                <button className="rounded-lg bg-blue-400 px-2 py-1 ml-1 text-white hover:bg-blue-900" onClick={() => { toast.remove(t.id); onClick()}}>{okButton}</button>
                <button className="rounded-lg bg-slate-100 px-2 py-1 ml-1" onClick={() => toast.remove(t.id)}>Cancel</button>
            </div>
        })
    }, []);

    return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <AddUser disabled={isLoading} onRefresh={refreshInbounds} setLoading={setLoading} protocols={inbounds?.map(i => i.protocol ?? '') ?? []}/>
        <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-md z-50">
                <tr>
                    <th className={classNames(headClass)}>#</th>
                    <th onClick={() => setSort(['email', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'email'})}>User</th>
                    <th onClick={() => setSort(['id', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'id'})}>ID</th>
                    <th onClick={() => setSort(['billingStartDate', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'billingStartDate'})}>Create Date<br/>Billing Start Date</th>
                    <th onClick={() => setSort(['maxConnections', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'maxConnections'})}>Max Connections</th>
                    <th onClick={() => setSort(['expireDays', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'expireDays'})}>Expire Days</th>
                    <th onClick={() => setSort(['deActiveDate', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'deActiveDate'})}>DeActive Date</th>
                    <th onClick={() => setSort(['firstConnect', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'firstConnect'})}>First connect</th>
                    <th onClick={() => setSort(['lastConnect', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'lastConnect'})}>Last connect</th>
                    <th className={classNames(headClass)}>Client Config</th>
                </tr>
            </thead>
            <tbody>
                {!inbounds || isLoading ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : inbounds.map(i => {
                    return <Fragment key={"inbound-" + i.protocol}>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={10} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol}</td>
                        </tr>
                        {[...(i.settings?.clients ?? [])].sort((a, b) => !sortColumn ? 0 : a[sortColumn] == b[sortColumn] ? 0 : a[sortColumn] < b[sortColumn] ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1)).filter(u => showAll || u.email?.startsWith('user')).map((u, index) => {
                            return <tr key={u.id} className={classNames("text-[0.78rem]",)}>
                                <td className={classNames("whitespace-nowrap border-b-2 py-1 px-3 border-l-8", { 'border-l-red-700 text-red-900': !!u.deActiveDate })}>{index + 1}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setUsername(i.protocol, u, value)} value={u.email}>{u.email}</Editable>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span className="block">{u.id}</span>
                                    <div className="block">
                                        <span onClick={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.protocol, u))} className="cursor-pointer text-blue-700">{'ReGenerate ID'}</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <DateView date={u.createDate}/>
                                    <DateView date={u.billingStartDate}/>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setMaxConnection(i.protocol, u, value)} value={u.maxConnections}>{u.maxConnections}</Editable>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setExpireDays(i.protocol, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                                </td>
                                <td className="border-b-2 py-1 px-3">
                                    <DateView date={u.deActiveDate}/>
                                    <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                                        <span className="block text-gray-500">{u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason?.substring(0,30) + '...' : u.deActiveReason}</span>
                                    </Popup>                                
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={u['firstConnect']}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={u['lastConnect']}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span onClick={() => showQRCode(i.protocol, u)} className="cursor-pointer text-blue-700">QR Code</span>
                                    {' | '}
                                    <Copy data={() => serverRequest(context.server, '/client_config?protocol=' + i.protocol, u).then(data => data.config)}>Copy Config</Copy>
                                    {' | '}
                                    <span onClick={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.protocol, u, u.deActiveDate ? true : false))} className="cursor-pointer text-blue-700">{u.deActiveDate?'Active':'De-Active'}</span>
                                    {' | '}
                                    <span onClick={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, u))} className="cursor-pointer text-blue-700">{'Remove'}</span>
                                </td>
                            </tr>
                        })}
                    </Fragment>
                })}
            </tbody>
        </table>
    </Container>
    
}