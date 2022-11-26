// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import ExportJsonExcel from 'js-export-excel';
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
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { Popup } from "../components/popup";
import { PopupMenu } from "../components/popup-menu";
import { usePrompt } from "../lib/hooks";
import { styles } from "../lib/styles";
import { DateUtil, serverRequest } from "../lib/util";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let [[sortColumn, sortAsc], setSort] = useState(['', true]);
    let showAll = router.query.all == '1';
    let [fullTime, setFullTime] = useState(false);
    let [precision, setPrecision] = useState(true);
    let [showId, setShowId] = useState(false);
    let [filter, setFilter] = useState('');
    let [statusFilter, setStatusFilter] = useState('');

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
    let {data: inbounds, mutate: refreshInbounds, isValidating: isLoading} = useSWR('/inbounds?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

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

    const addDays = useCallback(async (user, days) => {
        let result = await serverRequest(context.server, '/add_days', {email: user.email, days});
        if (result?.ok) {
            toast.success(`${days} days added to user ${user.email}`);
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user expire days');
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

    let headClass = styles.tableHead;

    // This line is only for fix tailwind bug that cannot resolve classNames from useCallback elements
    let el = <div className={"ring-1 ring-black ring-opacity-20 whitespace-nowrap text-sm shadow-lg bg-white flex rounded-lg pointer-events-auto px-3 py-2"}>
    <span className="flex-1 self-center mr-3"></span>

    <button className="rounded-lg duration-150 hover:shadow-md bg-slate-100 px-2 py-1 ml-1">Cancel</button>
    <button className="rounded-lg duration-150 hover:shadow-md bg-blue-400 px-2 py-1 ml-1 hover:bg-blue-600">OK</button>
    </div>

    const statusFilters = useMemo(() => {
        /** @type {{ [name: string]: (user: V2RayConfigInboundClient) => boolean }} */
        let filters = {
            'Active': u => !u.deActiveDate,
            'De-Active': u => !!u.deActiveDate,
            'Expired': u => (u.deActiveReason?.includes('Expired') ?? false),
            'Private': u => !!u.private,
            'Non-Private': u => !u.private,
            'Free': u => !!u.free,
            'Non-Free': u => !u.free,
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
            'Expiring (6 Hours)': u => !u.deActiveDate && !!u.billingStartDate &&  ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 6),
            'Expiring (24 Hours)': u => !u.deActiveDate && !!u.billingStartDate && ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24),
            'Expiring (3 Days)': u => !u.deActiveDate && !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 3),
            'Expiring (1 Week)': u => !u.deActiveDate && !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 7),
            'Re-activated from Expire (1 Week)': u => !!u.billingStartDate && u.billingStartDate != u.firstConnect && (Date.now() - new Date(u.billingStartDate).getTime() <= 1000 * 60 * 60 * 24 * 7)
        };

        return filters;
    }, []);

    const prompt = usePrompt();

    const exportExcel = useCallback(() => {
        console.log('Export Excel');
        let excel = new ExportJsonExcel({
            fileName: 'V2Ray-Clients',
            datas: [
                {
                    sheetData: inbounds?.flatMap(x => x.settings?.clients?.map(u => {
                        let {billingStartDate, createDate, email, emailAddress, mobile, maxConnections, firstConnect, free, fullName, id, deActiveDate, deActiveReason, expireDays, expiredDate } = u;
                        return {
                            protocol: x.protocol,
                            free: free ? 'Free' : 'Paid', 
                            email,
                            fullName,
                            emailAddress, 
                            mobile, 
                            createDate: createDate ? new Date(createDate) : null,
                            firstConnect : firstConnect ? new Date(firstConnect) : null, 
                            expireDays, 
                            expireDate: DateUtil.addDays(billingStartDate, expireDays ?? 30),
                            billingStartDate : billingStartDate ? new Date(billingStartDate) : null, 
                            maxConnections,
                            id, 
                            deActiveDate: deActiveDate ? new Date(deActiveDate) : null, 
                            deActiveReason, 
                            expiredDate: expiredDate ? new Date(expiredDate) : null
                        }
                    })),
                    sheetName: 'Clients',
                    sheetHeader: [
                        'Protocol',
                        'Free',
                        'Username',
                        'Full Name',
                        'Email Address',
                        'Mobile',
                        'Create Date',
                        'First Connect',
                        'Expire Days',
                        'Expire Date',
                        'Billing Start Date',
                        'Max Connections',
                        'ID',
                        'De-active Date',
                        'De-active Reason',
                        'Expired Date'
                    ]
                }
            ]
        })
        excel.saveExcel();
    }, [inbounds]);

    return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <AddUser className="py-2 text-xs xl:text-base" disabled={isLoading} onRefresh={refreshInbounds} protocols={inbounds?.map(i => i.protocol ?? '') ?? []}/>
        <FieldsGroup title="View" className="text-xs xl:text-base border-t-2 py-2" containerClassName="items-center">
            <Field label="Sort" htmlFor="sort">
                <select value={sortColumn} onChange={e => setSort([ e.currentTarget.value, sortAsc ])} id="sort" className={styles.input}>
                    <option value="-">-</option>
                    <option value="id">ID</option>
                    <option value="email">Username</option>
                    <option value="fullName">FullName</option>
                    <option value="mobile">Mobile</option>
                    <option value="emailAddress">Email</option>
                    <option value="maxConnections">Max Connections</option>
                    <option value="expireDays">Expire Days</option>
                    <option value="expireDate">Expire Date</option>
                    <option value="billingStartDate">Billing Start Date</option>
                    <option value="createDate">Create Date</option>
                    <option value="deActiveDate">De-active Date</option>
                    <option value="deActiveReason">De-active Reason</option>
                    <option value="firstConnect">First Connect</option>
                    <option value="lastConnect">Last Connect</option>
                </select>
            </Field>
            <Field label="Order" htmlFor="sort-order">
                <select value={sortAsc ? "asc" : "desc"} id="sort-order" className={styles.input} onChange={e => setSort([ sortColumn, e.currentTarget.value == "asc" ? true : false ])}>
                    <option value={"asc"}>ASC</option>
                    <option value={"desc"}>DESC</option>
                </select>
            </Field>
            <Field label="Filter" htmlFor="filter">
                <input type={"text"} id="filter" className={styles.input} onChange={e => setFilter(e.currentTarget.value)} value={filter}/>
            </Field>
            <Field label="Status" htmlFor="status">
                <select value={statusFilter} onChange={e => setStatusFilter(e.currentTarget.value)} id="statusFilter" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    {Object.keys(statusFilters).map((x, index) => <option key={index} value={x}>{x}</option>)}
                </select>
            </Field>
            <Field htmlFor="fullTime" label="Full Time">
                <input type={"checkbox"} id="fullTime" onChange={e => setFullTime(e.currentTarget.checked)} checked={fullTime}/>
            </Field>
            <Field label="Show ID" htmlFor="showId">
                <input type={"checkbox"} id="showId" onChange={e => setShowId(e.currentTarget.checked)} checked={showId}/>
            </Field>
            <Field label="Precision Date" htmlFor="precisionDate" data={precision} dataSetter={setPrecision}>
                <input type="checkbox" id="precisionDate"/>
            </Field>
            <div className="flex flex-row">
                {showAll ? <button className={styles.button} onClick={() => refreshInbounds()}>Reload</button> : null }
                <button className={styles.button} onClick={exportExcel}>Export Excel</button>
            </div>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
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
                {!inbounds ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : inbounds.map(i => {

                    let users = [...(i.settings?.clients ?? [])]
                    .map(u => {
                        u['expireDate'] = DateUtil.addDays(u.billingStartDate, u.expireDays ?? 30);
                        return u;
                    })
                    .filter(u => showAll || !u.private)
                    .filter(u => !filter || (u.id == filter || u.fullName?.includes(filter) || u.email?.includes(filter)))
                    .filter(u => statusFilters[statusFilter] ? statusFilters[statusFilter](u) : true)
                    .sort((a, b) => !sortColumn ? 0 : a[sortColumn] == b[sortColumn] ? 0 : a[sortColumn] < b[sortColumn] ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1));

                    return <Fragment key={"inbound-" + i.protocol}>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={5} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol} ({users.length} users)</td>
                        </tr>
                        {users
                        .map((u, index) => {
                            return <tr key={u.id} className={classNames("text-[0.78rem]",)}>
                                <td className={classNames("whitespace-nowrap border-b-2 py-1 px-3 border-l-0", { 'border-l-red-700 text-red-900': !!u.deActiveDate })}>{index + 1}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <div className="flex flex-row">
                                        <div className="items-center flex">
                                            <span className={classNames("rounded-full aspect-square inline-block w-3", { 'bg-red-600': !!u.deActiveDate, 'bg-green-600': !u.deActiveDate })}></span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-row">
                                                <Editable editable={!u.firstConnect || showAll} className={"font-semibold inline-block"} onEdit={value => setUsername(i.protocol, u, value)} value={u.email}>{u.email}</Editable>
                                                {u.private?<span className="ml-2 text-xs px-2 py-0 rounded-lg bg-gray-100 text-gray-500 cursor-default">Private</span>:null}
                                                {u.free?<span className="ml-2 text-xs px-2 py-0 rounded-lg bg-green-100 text-green-500 cursor-default">Free</span>:null}
                                            </div>
                                            <Editable className="text-gray-600 inline-block" onEdit={value => setInfo(i.protocol, u, 'fullName', value)} value={u.fullName}>{u.fullName ?? '-'}</Editable>
                                            {showId?<Info className="ml-3" label={"ID"}>{u.id}</Info>:null}
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
                                        <Editable editable={showAll} onEdit={value => setExpireDays(i.protocol, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                                        </Info>
                                        {!u.deActiveDate?
                                            <Info label={'Until Expire'}>
                                                <DateView precision={precision} full={fullTime} date={u['expireDate']}/>
                                            </Info>
                                        :null}
                                    </Infos>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <div className="flex flex-col xl:flex-row">
                                        <Infos className="flex-1">
                                            <Info label={'Create'}>
                                                <DateView precision={precision} full={fullTime} date={u.createDate}/>
                                            </Info>
                                            <Info label={'Billing'}>
                                                <DateView precision={precision} full={fullTime} date={u.billingStartDate}/>
                                            </Info>
                                            <Info label={'DeActived'}>
                                                <DateView precision={precision} full={fullTime} date={u.deActiveDate}/>
                                            </Info>
                                        </Infos>
                                        <Infos className="flex-1 xl:ml-2">
                                            <Info label={'Expired'}>
                                                <DateView precision={precision} full={fullTime} date={u.expiredDate}/>
                                            </Info>
                                            <Info label={'First Connect'}>
                                                <DateView precision={precision} full={fullTime} date={u.firstConnect}/>
                                            </Info>
                                            <Info label={'Last Connect'}>
                                                <DateView precision={precision} full={fullTime} date={u['lastConnect']}/>
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
                                        {showAll || !u.deActiveReason?.includes('Expired') ? <PopupMenu.Item action={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.protocol, u, u.deActiveDate ? true : false))}>{u.deActiveDate?'Active User':'De-Active User'}</PopupMenu.Item>:null}
                                        {(showAll || !u.firstConnect) ? <PopupMenu.Item action={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, u))}>
                                            Remove User
                                        </PopupMenu.Item> : null }
                                        <PopupMenu.Item action={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.protocol, u))}>
                                            ReGenerate ID
                                        </PopupMenu.Item>
                                        <PopupMenu.Item action={() => prompt(`Add 1 Months to Expire Days for user "${u.email}" ?`, `Add Expire Days`, () => addDays(u, 30))}>
                                            +1 Months
                                        </PopupMenu.Item>
                                        <PopupMenu.Item action={() => router.push(`/transactions?user=${u.email}` + (showAll ? `&all=1` : ''))}>
                                            Transactions
                                        </PopupMenu.Item>
                                        <PopupMenu.Item action={() => router.push(`/usages?user=${u.email}` + (showAll ? `&all=1` : ''))}>
                                            Daily Usages
                                        </PopupMenu.Item>
                                        {showAll?
                                        <PopupMenu.Item action={() => router.push(`/logs?all=1&filter=`+u.email)}>
                                            Logs
                                        </PopupMenu.Item>: null}
                                        {!u.createDate || showAll ? <PopupMenu.Item action={() => prompt(`Set first connect date as create date for user "${u.email}" ?`, `Set Create Date`, () => setInfo(i.protocol, u, 'createDate', u.firstConnect))}>Set First Connect as Create Date</PopupMenu.Item> : null}
                                        {showAll ? <PopupMenu.Item action={() => prompt(`Set user "${u.email}" ${u.private?"public":"private"}?`, `Change Private`, () => setInfo(i.protocol, u, 'private', !u.private))}>Set {u.private?'Public':'Private'}</PopupMenu.Item> : null}
                                        {showAll ? <PopupMenu.Item action={() => prompt(`Set user "${u.email}" as ${u.free?"Non-free":"Free"}?`, `Free/Paid`, () => setInfo(i.protocol, u, 'free', !u.free))}>Set {u.free?'Non-Free':'Free'}</PopupMenu.Item> : null}
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