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
import { PopupMenu } from "../components/popup-menu";
import { serverRequest } from "../util";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let [isLoading, setLoading] = useState(false);
    let [[sortColumn, sortAsc], setSort] = useState(['', true]);
    let showAll = router.query.all == '1';
    let [fullTime, setFullTime] = useState(false);

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

    const setInfo = useCallback(async (protocol, user, prop, value) => {
        let result = await serverRequest(context.server, '/set_info', {email: user.email, protocol, value, prop});
        if (result?.ok) {
            toast.success(prop + ' changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user '+ prop);
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

    let headClass = 'px-1 py-2 border-b-2 border-b-blue-900 rounded-tl-lg rounded-tr-lg';

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
        <div className="flex flex-row px-3 py-3 border-t-[1px]">
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="mobile" className={"py-1 pr-2 self-start font-semibold"}>Sort</label>
                <select value={sortColumn} onChange={e => setSort([ e.currentTarget.value, sortAsc ])} id="sort" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    <option value="id">ID</option>
                    <option value="email">Username</option>
                    <option value="fullName">FullName</option>
                    <option value="mobile">Mobile</option>
                    <option value="emailAddress">Email</option>
                    <option value="maxConnections">Max Connections</option>
                    <option value="expireDays">Expire Days</option>
                    <option value="createDate">Create Date</option>
                    <option value="billingStartDate">Billing Start Date</option>
                    <option value="deActiveDate">De-active Date</option>
                    <option value="deActiveReason">De-active Reason</option>
                    <option value="firstConnect">First Connect</option>
                    <option value="lastConnect">Last Connect</option>
                </select>
                <select value={sortAsc ? "asc" : "desc"} className="bg-slate-100 rounded-lg px-2 py-1 ml-1" onChange={e => setSort([ sortColumn, e.currentTarget.value == "asc" ? true : false ])}>
                    <option value={"asc"}>ASC</option>
                    <option value={"desc"}>DESC</option>
                </select>
            </div>
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="fullTime" className={"py-1 pr-2 self-start font-semibold"}>Full Time</label>                
                <input type={"checkbox"} id="fullTime" onChange={e => setFullTime(e.currentTarget.checked)} checked={fullTime}/>
            </div>
        </div>
        <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-md z-50">
                <tr>
                    <th className={classNames(headClass)}>#</th>
                    <th onClick={() => setSort(['email', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'email'})}>User / FullName</th>
                    {/* <th onClick={() => setSort(['id', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-100': sortColumn == 'id'})}>ID</th> */}
                    <th onClick={() => setSort(['maxConnections', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'maxConnections'})}>Max Connections</th>
                    <th onClick={() => setSort(['expireDays', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'expireDays'})}>Expire Days</th>
                    <th onClick={() => setSort(['deActiveDate', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'deActiveDate'})}>DeActive Reason</th>
                    <th onClick={() => setSort(['createDate', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'createDate'})}>Date</th>
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
                                <td className={classNames("whitespace-nowrap border-b-2 py-1 px-3 border-l-0", { 'border-l-red-700 text-red-900': !!u.deActiveDate })}>{index + 1}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <div className="flex flex-row">
                                        <div className="items-center flex">
                                            <span className={classNames("rounded-full aspect-square inline-block w-3", { 'bg-red-600': !!u.deActiveDate, 'bg-green-600': !u.deActiveDate })}></span>
                                        </div>
                                        <div>
                                            <Editable className={"font-semibold"} onEdit={value => setUsername(i.protocol, u, value)} value={u.email}>{u.email}</Editable>
                                            <Editable className="text-gray-600" onEdit={value => setInfo(i.protocol, u, 'fullName', value)} value={u.fullName}>{u.fullName ?? '-'}</Editable>
                                        </div>
                                    </div>
                                </td>
                                {/* <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span className="block">{u.id}</span>
                                    <div className="block">
                                        <span onClick={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.protocol, u))} className="cursor-pointer text-blue-700">{'ReGenerate ID'}</span>
                                    </div>
                                </td> */}
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setMaxConnection(i.protocol, u, value)} value={u.maxConnections}>{u.maxConnections}</Editable>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setExpireDays(i.protocol, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                                </td>
                                <td className="border-b-2 py-1 px-3">
                                    <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                                        <Editable onEdit={value => setInfo(i.protocol, u, 'deActiveReason', value)} value={u.deActiveReason}>{(u.deActiveReason?.length ?? 0) > 30 ? u.deActiveReason?.substring(0,30) + '...' : (u.deActiveReason ?? '-')}</Editable>
                                        {/* <span className="block text-gray-500">{u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason?.substring(0,30) + '...' : u.deActiveReason ?? '-'}</span> */}
                                    </Popup>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <div className="flex flex-col">
                                        <div className="flex flex-row">
                                            <span className="flex-1 text-gray-400">Create</span>
                                            <DateView full={fullTime} date={u.createDate}/>
                                        </div>
                                        <div className="flex flex-row">
                                            <span className="flex-1 text-gray-400">Billing</span>
                                            <DateView full={fullTime} date={u.billingStartDate}/>
                                        </div>
                                        <div className="flex flex-row">
                                            <span className="flex-1 text-gray-400">DeActived</span>
                                            <DateView full={fullTime} date={u.deActiveDate}/>
                                        </div>
                                        <div className="flex flex-row">
                                            <span className="flex-1 text-gray-400">Expired</span>
                                            <DateView full={fullTime} date={u.expiredDate}/>
                                        </div>
                                        <div className="flex flex-row">
                                            <span className="flex-1 text-gray-400">First Connect</span>
                                            <DateView full={fullTime} date={u.firstConnect}/>
                                        </div>
                                        <div className="flex flex-row">
                                            <span className="flex-1 text-gray-400">Last Connect</span>
                                            <DateView full={fullTime} date={u['lastConnect']}/>
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <PopupMenu>
                                        <PopupMenu.Item action={() => showQRCode(i.protocol, u)}>QR Code</PopupMenu.Item>
                                        <PopupMenu.Item>
                                            <Copy className="block text-inherit" notifyText={`User "${u.email}" ID copied`} data={u.id}>Copy User ID</Copy>
                                        </PopupMenu.Item>
                                        <PopupMenu.Item>
                                            <Copy className="block text-inherit" notifyText={`User "${u.email}" client config copied`} data={() => serverRequest(context.server, '/client_config?protocol=' + i.protocol, u).then(data => data.config)}>Copy Config</Copy>
                                        </PopupMenu.Item>
                                        <PopupMenu.Item action={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.protocol, u, u.deActiveDate ? true : false))}>{u.deActiveDate?'Active User':'De-Active User'}</PopupMenu.Item>
                                        <PopupMenu.Item action={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, u))}>
                                            Remove User
                                        </PopupMenu.Item>
                                        <PopupMenu.Item action={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.protocol, u))}>
                                            ReGenerate ID
                                        </PopupMenu.Item>
                                    </PopupMenu>
                                    {/* <span onClick={() => showQRCode(i.protocol, u)} className="cursor-pointer text-blue-700">QR Code</span>
                                    {' | '}
                                    <Copy data={() => serverRequest(context.server, '/client_config?protocol=' + i.protocol, u).then(data => data.config)}>Copy Config</Copy>                                    
                                    {' | '}
                                    <span onClick={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.protocol, u, u.deActiveDate ? true : false))} className="cursor-pointer text-blue-700">{u.deActiveDate?'Active':'De-Active'}</span>
                                    {' | '}
                                    <span onClick={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, u))} className="cursor-pointer text-blue-700">{'Remove'}</span> */}
                                </td>
                            </tr>
                        })}
                    </Fragment>
                })}
            </tbody>
        </table>
    </Container>
    
}