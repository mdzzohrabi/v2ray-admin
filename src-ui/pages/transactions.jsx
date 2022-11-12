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
import { usePrompt } from "../hooks";
import { styles } from "../styles";
import { serverRequest } from "../util";

export default function TransactionsPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let [isLoading, setLoading] = useState(false);
    let [[sortColumn, sortAsc], setSort] = useState(['', true]);
    let showAll = router.query.all == '1';
    let [fullTime, setFullTime] = useState(false);
    let [filter, setFilter] = useState('');
    let [statusFilter, setStatusFilter] = useState('');

    /**
     * @type {import("swr").SWRResponse<Transaction[]>}
     */
    let {data: transactions, mutate: refreshList} = useSWR('/transactions?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

    const statusFilters = useMemo(() => {
        /** @type {{ [name: string]: (user: V2RayConfigInboundClient) => boolean }} */
        let filters = {
            'Active': u => !u.deActiveDate,
            'De-Active': u => !!u.deActiveDate,
            'Expired': u => (u.deActiveReason?.includes('Expired') ?? false),
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
            'Expiring (6 Hours)': u => !!u.billingStartDate &&  ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 6),
            'Expiring (24 Hours)': u => !!u.billingStartDate && ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24),
            'Expiring (3 Days)': u => !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 3),
            'Expiring (1 Week)': u => !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 7),
        };

        return filters;
    }, []);

    const prompt = usePrompt();

    return <Container>
        <Head>
            <title>Transactions</title>
        </Head>
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
                    <th className={classNames(styles.tableHead)}>#</th>
                    <th onClick={() => setSort(['remark', !sortAsc])} className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': sortColumn == 'remark'})}>Remark</th>
                    <th onClick={() => setSort(['amount', !sortAsc])} className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': sortColumn == 'amount'})}>Amount</th>
                    <th onClick={() => setSort(['createDate', !sortAsc])} className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': sortColumn == 'createDate'})}>Dates</th>
                    <th className={classNames(styles.tableHead)}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {!transactions || isLoading ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : transactions.map(i => {
                    return <Fragment key={"transaction-" + i.id}>
                    </Fragment>
                })}
            </tbody>
        </table>
        </div>
    </Container>
    
}