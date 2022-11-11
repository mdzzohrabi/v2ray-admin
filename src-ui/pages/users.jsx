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
import { Info, Infos } from "../components/info";
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
    let [filter, setFilter] = useState('');
    let [statusFilter, setStatusFilter] = useState('');

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
    let {data: inbounds, mutate: refreshInbounds} = useSWR('/inbounds?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

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
            toast.success(prop + ' changed for user "'+user.email+'"');
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

    const statusFilters = useMemo(() => {
        /** @type {{ [name: string]: (user: V2RayConfigInboundClient) => boolean }} */
        let filters = {
            'Active': u => !u.deActiveDate,
            'De-Active': u => !!u.deActiveDate,
            'Expired': u => !!u.expiredDate || (u.deActiveReason?.includes('Expired') ?? false),
            'Without FullName': u => !u.fullName,
            'With FullName': u => !!u.fullName,
            'Without Mobile': u => !u.mobile,
            'With Mobile': u => !!u.mobile,
            'Not Connected (1 Hour)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60),
            'Not Connected (10 Hours)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 10),
            'Not Connected (1 Day)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 24),
            'Not Connected (1 Month)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 24 * 30),
            'Connected (1 Hour)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60),
            'Connected (10 Hours)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 10),
            'Connected (1 Day)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 24),
            'Connected (1 Month)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 24 * 30),
            'Recently Created (1 Hour)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60),
            'Recently Created (10 Hours)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 10),
            'Recently Created (1 Day)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 24),
            'Recently Created (1 Month)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 24 * 30),
        };

        return filters;
    }, []);

    const prompt = useCallback((message, okButton, onClick) => {
        toast.custom(t => {
            return <div className={"ring-1 ring-black ring-opacity-20 whitespace-nowrap text-sm shadow-lg bg-white flex rounded-lg pointer-events-auto px-3 py-2"}>
                <span className="flex-1 self-center mr-3">{message}</span>
                <button className="rounded-lg duration-150 hover:shadow-md bg-blue-400 px-2 py-1 ml-1 text-white hover:bg-blue-900" onClick={() => { toast.remove(t.id); onClick()}}>{okButton}</button>
                <button className="rounded-lg duration-150 hover:shadow-md bg-slate-100 px-2 py-1 ml-1" onClick={() => toast.remove(t.id)}>Cancel</button>
            </div>
        })
    }, []);

    return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <AddUser disabled={isLoading} onRefresh={refreshInbounds} setLoading={setLoading} protocols={inbounds?.map(i => i.protocol ?? '') ?? []}/>
        <div className="flex flex-row px-3 py-3 border-t-[1px] overflow-auto">
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="sort" className={"self-center py-1 pr-2 font-semibold"}>Sort</label>
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
            <div className="flex flex-row px-2 mx-2 text-sm border-r-[1px] border-l-[1px] border-gray-200">
                <label htmlFor="fullTime" className={"py-1 pr-2 self-center font-semibold"}>Full Time</label>                
                <input type={"checkbox"} id="fullTime" onChange={e => setFullTime(e.currentTarget.checked)} checked={fullTime}/>
            </div>
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="filter" className={"py-1 pr-2 self-center font-semibold"}>Filter</label>                
                <input type={"text"} id="filter" className="border-gray-500 border-solid border-b-0 bg-slate-100 rounded-md invalid:border-red-500 invalid:ring-red-600 px-2 py-1 focus:outline-blue-500" onChange={e => setFilter(e.currentTarget.value)} value={filter}/>
            </div>
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="statusFilter" className={"self-center py-1 pr-2 pl-2 font-semibold"}>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.currentTarget.value)} id="statusFilter" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    {Object.keys(statusFilters).map(x => <option value={x}>{x}</option>)}
                </select>
            </div>
        </div>
        <div className="">
        <table className="w-full text-sm">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(headClass)}>#</th>
                    <th onClick={() => setSort(['email', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'email'})}>User / FullName</th>
                    <th className={classNames(headClass, 'cursor-pointer')}>Infos</th>
                    <th onClick={() => setSort(['createDate', !sortAsc])} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': sortColumn == 'createDate'})}>Dates</th>
                    <th className={classNames(headClass)}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {!inbounds || isLoading ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : inbounds.map(i => {
                    return <Fragment key={"inbound-" + i.protocol}>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={5} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol}</td>
                        </tr>
                        {[...(i.settings?.clients ?? [])].sort((a, b) => !sortColumn ? 0 : a[sortColumn] == b[sortColumn] ? 0 : a[sortColumn] < b[sortColumn] ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1))
                        .filter(u => showAll || u.email?.startsWith('user'))
                        .filter(u => !filter || (u.fullName?.includes(filter) || u.email?.includes(filter)))
                        .filter(u => statusFilters[statusFilter] ? statusFilters[statusFilter](u) : true)
                        .map((u, index) => {
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
                                            {u.deActiveDate ? 
                                            <Info label={"De-active reason"} className="ml-2">
                                                <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                                                    <Editable onEdit={value => setInfo(i.protocol, u, 'deActiveReason', value)} value={u.deActiveReason}>{(u.deActiveReason?.length ?? 0) > 30 ? u.deActiveReason?.substring(0,30) + '...' : (u.deActiveReason ?? '-')}</Editable>
                                                </Popup>
                                            </Info> : null }
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Infos>
                                        <Info label={"Mobile"}>
                                            <Editable onEdit={value => setInfo(i.protocol, u, 'mobile', value)} value={u.mobile}>{u.mobile ?? 'N/A'}</Editable>
                                        </Info>
                                        <Info label={"Email"}>
                                            <Editable onEdit={value => setInfo(i.protocol, u, 'emailAddress', value)} value={u.emailAddress}>{u.emailAddress ?? 'N/A'}</Editable>
                                        </Info>
                                        <Info label={'Max Connections'}>
                                            <Editable onEdit={value => setMaxConnection(i.protocol, u, value)} value={u.maxConnections}>{u.maxConnections}</Editable>
                                        </Info>
                                        <Info label={'Expire Days'}>
                                        <Editable onEdit={value => setExpireDays(i.protocol, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                                        </Info>
                                    </Infos>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <div className="flex flex-col xl:flex-row">
                                        <Infos className="flex-1">
                                            <Info label={'Create'}>
                                                <DateView full={fullTime} date={u.createDate}/>
                                            </Info>
                                            <Info label={'Billing'}>
                                                <DateView full={fullTime} date={u.billingStartDate}/>
                                            </Info>
                                            <Info label={'DeActived'}>
                                                <DateView full={fullTime} date={u.deActiveDate}/>
                                            </Info>
                                        </Infos>
                                        <Infos className="flex-1 xl:ml-2">
                                            <Info label={'Expired'}>
                                                <DateView full={fullTime} date={u.expiredDate}/>
                                            </Info>
                                            <Info label={'First Connect'}>
                                                <DateView full={fullTime} date={u.firstConnect}/>
                                            </Info>
                                            <Info label={'Last Connect'}>
                                                <DateView full={fullTime} date={u['lastConnect']}/>
                                            </Info>
                                        </Infos>
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
                                        <PopupMenu.Item action={() => prompt(`Add 1 Months to Expire Days for user "${u.email}" ?`, `Add Expire Days`, () => setExpireDays(i.protocol, u, Number(u.expireDays ?? 30) + 30))}>
                                            +1 Months
                                        </PopupMenu.Item>
                                        {showAll?
                                        <PopupMenu.Item action={() => router.push(`/logs?all=1&filter=`+u.email)}>
                                            Logs
                                        </PopupMenu.Item>: null}
                                    </PopupMenu>
                                </td>
                            </tr>
                        })}
                    </Fragment>
                })}
            </tbody>
        </table>
        </div>
    </Container>
    
}