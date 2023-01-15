// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import ExportJsonExcel from 'js-export-excel';
import Head from "next/head";
import { useRouter } from "next/router";
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from "react-hot-toast";
import useSWR from 'swr';
import { AddUser } from "../components/add-user";
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { Copy } from "../components/copy";
import { DateView } from "../components/date-view";
import { useDialog } from "../components/dialog";
import { Editable } from "../components/editable";
import { ChangeInboundEditor } from "../components/editor/change-inbound-editor";
import { CopyUserEditor } from "../components/editor/copy-user";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { Popup } from "../components/popup";
import { PopupMenu } from "../components/popup-menu";
import { Size } from "../components/size";
import { usePrompt } from "../lib/hooks";
import { styles } from "../lib/styles";
import { DateUtil, serverRequest, store, stored } from "../lib/util";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';

    /** @type {string[]} */
    let initStatusFilter = [];

    /** @type {string[]} */
    let initInboundsFilter = [];

    let [view, setView] = useState(stored('users-view', {
        sortColumn: '',
        sortAsc: true,
        fullTime: false,
        precision: true,
        showId: false,
        filter: '',
        statusFilter: initStatusFilter,
        page: 1,
        limit: 20,
        inbounds: initInboundsFilter
    }));

    useEffect(() => store('users-view', view), [view]);

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
    let {data: inboundsResponse, mutate: refreshInbounds, isValidating: isLoading} = useSWR({
        url: '/inbounds?key=' + btoa(context.server.url),
        body: {
            private: showAll,
            view
        }
    }, serverRequest.bind(this, context.server));

    let inbounds = useMemo(() => inboundsResponse?.filter(x => x.protocol == 'vmess') ?? [], [inboundsResponse]);

    const showQRCode = useCallback(async (tag, user) => {
        let config = await serverRequest(context.server, '/client_config?tag=' + tag, user).then(data => data.config)
        let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(config);
        window.open(link);
    }, [router]);

    const setActive = useCallback(async (tag, user, active) => {
        let result = await serverRequest(context.server, '/active', {email: user.email, tag, active});
        if (result?.ok) {
            toast.success('Changes made successful');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot save changes');
        }
    }, [router]);

    const removeUser = useCallback(async (protocol, tag, user) => {
        let result = await serverRequest(context.server, '/remove_user', {email: user.email, tag, protocol});
        if (result?.ok) {
            toast.success('User removed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot remove user');
        }
    }, [router]);

    const setMaxConnection = useCallback(async (tag, user, value) => {
        let result = await serverRequest(context.server, '/max_connections', {email: user.email, tag, value});
        if (result?.ok) {
            toast.success('Max connection changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setExpireDays = useCallback(async (tag, user, value) => {
        let result = await serverRequest(context.server, '/expire_days', {email: user.email, tag, value});
        if (result?.ok) {
            toast.success('Expire days changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const addDays = useCallback(async (tag, user, days) => {
        let result = await serverRequest(context.server, '/add_days', {email: user.email, days, tag});
        if (result?.ok) {
            toast.success(`${days} days added to user ${user.email}`);
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user expire days');
        }
    }, [router]);

    const setUsername = useCallback(async (tag, user, value) => {
        let result = await serverRequest(context.server, '/change_username', {email: user.email, tag, value});
        if (result?.ok) {
            toast.success('Username changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setInfo = useCallback(async (tag, user, prop, value) => {
        let result = await serverRequest(context.server, '/set_info', {email: user.email, tag, value, prop});
        if (result?.ok) {
            toast.success(prop + ' changed for user "'+user.email+'"');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user '+ prop);
        }
    }, [router]);


    const reGenerateId = useCallback(async (tag, user) => {
        let result = await serverRequest(context.server, '/regenerate_id', {email: user.email, tag});
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

    /**
     * @type {import("swr").SWRResponse<string[]>}
     */
    const {data: statusFilters} = useSWR('/status_filters', serverRequest.bind(this, context.server));

    const prompt = usePrompt();

    const changeInboundDialog = useDialog((context, inbounds, currentInbound, user, onEdit, onClose = null) => <ChangeInboundEditor context={context} inbounds={inbounds} currentInbound={currentInbound} user={user} onEdit={onEdit} dissmis={onClose}/>);

    const copyUserDialog = useDialog((context, inbounds, currentInbound, user, onEdit, onClose = null) => <CopyUserEditor context={context} inbounds={inbounds} currentInbound={currentInbound} user={user} onEdit={onEdit} dissmis={onClose}/>);


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
    
    let maxUsers = inbounds?.map(x => x.settings ? x.settings['totalClients'] : 0).reduce((a, b) => a > b ? a : b, 0) ?? 0;
    let totalPages = Number( Math.ceil( maxUsers / view.limit ) ) || 1;

    return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <AddUser className="py-2" disabled={isLoading} onRefresh={refreshInbounds} inbounds={inbounds ?? []}/>
        <FieldsGroup data={view} dataSetter={setView} title="View" className="border-t-2 py-2" containerClassName="items-center">
            <Field label="Inbounds" htmlFor="inbounds">
                <div className="flex gap-1 mb-1">
                    {view.inbounds?.map((filter, index) => <span key={index} onClick={() => setView({ ...view, inbounds: view.inbounds.filter(x => x != filter)})} className={classNames("whitespace-nowrap bg-slate-200 px-3 py-1 rounded-3xl cursor-pointer hover:bg-slate-700 hover:text-white")}>{filter}</span> )}
                </div>
                <select value={"-"} onChange={e => setView({ ...view, inbounds: [...(view.inbounds ?? []), e.currentTarget.value]})} id="inbounds" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    {(inbounds ?? []).map((x, index) => <option key={index} value={x.tag}>{x.tag} ({x.protocol})</option>)}
                </select>
            </Field>
            <Field label="Page" htmlFor="page">
                <select id="page" className={styles.input}>
                    {[...new Array(totalPages)].map((x, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
            </Field>
            <Field label="Limit" htmlFor="limit">
                <select id="limit" className={styles.input}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400</option>
                    <option value={500}>500</option>
                </select>
            </Field>
            <Field label="Sort" htmlFor="sortColumn">
                <select id="sortColumn" className={styles.input}>
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
                    <option value="quotaUsage">Bandwidth Usage</option>
                    <option value="quotaLimit">Bandwidth Limit</option>
                </select>
            </Field>
            <Field label="Order" htmlFor="sort-order">
                <select value={view?.sortAsc ? "asc" : "desc"} id="sort-order" className={styles.input} onChange={e => setView({ ...view, sortAsc: e.currentTarget.value == "asc" })}>
                    <option value={"asc"}>ASC</option>
                    <option value={"desc"}>DESC</option>
                </select>
            </Field>
            <Field label="Filter" htmlFor="filter">
                <input type={"text"} id="filter" className={styles.input}/>
            </Field>
            <Field label="Status" htmlFor="status">
                <div className="flex gap-1 mb-1">
                    {view.statusFilter?.map((filter, index) => <span key={index} onClick={() => setView({ ...view, statusFilter: view.statusFilter.filter(x => x != filter)})} className={classNames("whitespace-nowrap bg-slate-200 px-3 py-1 rounded-3xl cursor-pointer hover:bg-slate-700 hover:text-white")}>{filter}</span> )}
                </div>
                <select value={"-"} onChange={e => setView({ ...view, statusFilter: [...view.statusFilter, e.currentTarget.value]})} id="statusFilter" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    {(statusFilters ?? []).map((x, index) => <option key={index} value={x}>{x}</option>)}
                </select>
            </Field>
            <Field htmlFor="fullTime" label="Full Time">
                <input type={"checkbox"} id="fullTime"/>
            </Field>
            <Field label="Show ID" htmlFor="showId">
                <input type={"checkbox"} id="showId"/>
            </Field>
            <Field label="Precision Date" htmlFor="precision">
                <input type="checkbox" id="precision"/>
            </Field>
            <div className="flex flex-row">
                <button className={styles.button} onClick={() => refreshInbounds()}>Reload</button>
                <button className={styles.button} onClick={exportExcel}>Export Excel</button>
            </div>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <div className="">
        <table className="w-full">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(headClass)}>#</th>
                    <th onClick={() => setView({ ...view, sortColumn:'email', sortAsc: !view.sortAsc })} className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': view.sortColumn == 'email'})}>User / FullName</th>
                    <th className={classNames(headClass, 'cursor-pointer')}>Infos</th>
                    <th className={classNames(headClass, 'cursor-pointer', {'bg-slate-200': view.sortColumn == 'createDate'})}>Dates</th>
                    <th className={classNames(headClass)}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {!inbounds ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : inbounds.filter(x => !view.inbounds || view.inbounds?.length == 0 || view.inbounds.includes(x.tag ?? '')).map(i => {
                    let users = i.settings?.clients ?? [];
                    let totalUsers = i.settings ? i.settings['totalClients'] ?? 0 : 0;
                    let totalFiltered = i.settings ? i.settings['totalFiltered'] ?? 0 : 0;
                    let from = i.settings ? i.settings['from'] ?? 0 : 0;
                    let to = i.settings ? i.settings['to'] ?? 0 : 0;
                    let {showId, fullTime, precision} = view;
                    return <Fragment key={"inbound-" + i.protocol + '-' + i.tag}>
                        <tr>
                            <td colSpan={5} className="uppercase bg-slate-100 px-4 py-3">
                                <span className="font-bold">{i.tag}</span>
                                <span className="text-slate-500 pl-2">({i.protocol}) ( {from}-{to} / {totalFiltered} users ) - Total = {totalUsers} users</span>
                            </td>
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
                                                <Editable editable={!u.firstConnect || showAll} className={"font-semibold inline-block"} onEdit={value => setUsername(i.tag, u, value)} value={u.email}>{u.email}</Editable>
                                                {u.private?<span className="ml-2 text-xs px-2 py-0 rounded-lg bg-gray-100 text-gray-500 cursor-default">Private</span>:null}
                                                {u.free?<span className="ml-2 text-xs px-2 py-0 rounded-lg bg-green-100 text-green-500 cursor-default">Free</span>:null}
                                            </div>
                                            <Editable className="text-gray-600 inline-block" onEdit={value => setInfo(i.tag, u, 'fullName', value)} value={u.fullName}>{u.fullName ?? '-'}</Editable>
                                            {showId?<Info className="ml-3" label={"ID"}>{u.id}</Info>:null}
                                            {u.deActiveDate ? 
                                            <Info label={"De-active reason"} className="ml-2">
                                                <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                                                    <Editable onEdit={value => setInfo(i.tag, u, 'deActiveReason', value)} value={u.deActiveReason}>{(u.deActiveReason?.length ?? 0) > 30 ? u.deActiveReason?.substring(0,30) + '...' : (u.deActiveReason ?? '-')}</Editable>
                                                </Popup>
                                            </Info> : null }
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Infos>
                                        <Info label={"Mobile"}>
                                            <Editable onEdit={value => setInfo(i.tag, u, 'mobile', value)} value={u.mobile}>{u.mobile ?? 'N/A'}</Editable>
                                        </Info>
                                        <Info label={"Email"}>
                                            <Editable onEdit={value => setInfo(i.tag, u, 'emailAddress', value)} value={u.emailAddress}>{u.emailAddress ?? 'N/A'}</Editable>
                                        </Info>
                                        <Info label={'Max Connections'}>
                                            <Editable onEdit={value => setMaxConnection(i.tag, u, value)} value={u.maxConnections}>{u.maxConnections}</Editable>
                                        </Info>
                                        <Info label={'Expire Days'}>
                                            <Editable editable={showAll} onEdit={value => setExpireDays(i.tag, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                                        </Info>
                                        <Info label={'Bandwidth'}>
                                            <Editable input={{
                                                type: 'number',
                                                placeholder: '1'
                                            }} editable={true} onEdit={value => setInfo(i.tag, u, 'quotaLimit', value * 1024 * 1024 * 1024)} value={u.quotaLimit} postfix={'GB'}>
                                                <Size size={u['quotaUsage'] ?? 0}/> / {u.quotaLimit && u.quotaLimit > 0 ? <Size size={u.quotaLimit ?? 0}/> : '∞' }
                                            </Editable>
                                        </Info>
                                        <Info label={'Last Connected IP'}>
                                            {u['lastConnectIP'] ?? '-'}
                                            {u['lastConnectIP'] ? <a target={'_blank'} className={classNames(styles.link, 'pl-1')} href={`https://whatismyipaddress.com/ip/${u['lastConnectIP']}`}>(Info)</a> : null}
                                        </Info>
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
                                            <Info label={'Until Expire'}>
                                                <DateView precision={precision} full={fullTime} date={u['expireDate']}/>
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
                                            {u['quotaUsageUpdate'] ? <Info label={'Bandwidth Update'}>
                                                <DateView precision={precision} full={fullTime} date={u['quotaUsageUpdate']}/>
                                            </Info> : null }
                                        </Infos>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <PopupMenu>
                                        <PopupMenu.Item action={() => showQRCode(i.tag, u)}>QR Code</PopupMenu.Item>
                                        <PopupMenu.Item>
                                            <Copy className="block text-inherit" notifyText={`User "${u.email}" ID copied`} data={u.id}>Copy User ID</Copy>
                                        </PopupMenu.Item>
                                        <PopupMenu.Item>
                                            <Copy className="block text-inherit" notifyText={`User "${u.email}" client config copied`} data={() => serverRequest(context.server, '/client_config?tag=' + i.tag, u).then(data => data.config)}>Copy Config</Copy>
                                        </PopupMenu.Item>
                                        {showAll || !u.deActiveReason?.includes('Expired') ? <PopupMenu.Item action={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.tag, u, u.deActiveDate ? true : false))}>{u.deActiveDate?'Active User':'De-Active User'}</PopupMenu.Item>:null}
                                        {(showAll || !u.firstConnect) ? <PopupMenu.Item action={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, i.tag, u))}>
                                            Remove User
                                        </PopupMenu.Item> : null }
                                        <PopupMenu.Item action={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.tag, u))}>
                                            ReGenerate ID
                                        </PopupMenu.Item>
                                        <PopupMenu.Item action={() => prompt(`Add 1 Months to Expire Days for user "${u.email}" ?`, `Add Expire Days`, () => addDays(i.tag, u, 30))}>
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
                                        {!u.createDate || showAll ? <PopupMenu.Item action={() => prompt(`Set first connect date as create date for user "${u.email}" ?`, `Set Create Date`, () => setInfo(i.tag, u, 'createDate', u.firstConnect))}>Set First Connect as Create Date</PopupMenu.Item> : null}
                                        {showAll ? <PopupMenu.Item action={() => prompt(`Set user "${u.email}" ${u.private?"public":"private"}?`, `Change Private`, () => setInfo(i.tag, u, 'private', !u.private))}>Set {u.private?'Public':'Private'}</PopupMenu.Item> : null}
                                        {showAll ? <PopupMenu.Item action={() => prompt(`Set user "${u.email}" as ${u.free?"Non-free":"Free"}?`, `Free/Paid`, () => setInfo(i.tag, u, 'free', !u.free))}>Set {u.free?'Non-Free':'Free'}</PopupMenu.Item> : null}

                                        <PopupMenu.Item action={() => changeInboundDialog.show(context, inbounds, i.tag, u.email, () => refreshInbounds())}>
                                            Change Inbound
                                        </PopupMenu.Item>

                                        {showAll ? <PopupMenu.Item action={() => copyUserDialog.show(context, inbounds, i.tag, u.email, () => refreshInbounds())}>
                                            Copy User
                                        </PopupMenu.Item> : null}
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