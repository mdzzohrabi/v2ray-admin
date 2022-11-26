// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useContext, useMemo, useState } from 'react';
import toast from "react-hot-toast";
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { DateView } from "../components/date-view";
import { Editable } from "../components/editable";
import { Field, FieldsGroup } from "../components/fields";
import { PopupMenu } from "../components/popup-menu";
import { Price } from "../components/price";
import { usePrompt } from "../lib/hooks";
import { styles } from "../lib/styles";
import { arrSort, serverRequest } from "../lib/util";

export default function TransactionsPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    /** @type {[Partial<Transaction>, React.Dispatch<React.SetStateAction<Partial<Transaction>>>]} */
    let [newTransaction, setNewTransaction] = useState({});
    let [view, setView] = useState({
        fullTime: true,
        user: router.query.user,
        sortColumn: '',
        sortOrder: 'asc'
    })
    const prompt = usePrompt();

    /**
     * @type {import("swr").SWRResponse<Transaction[]>}
     */
    let {data: transactions, mutate: refreshList} = useSWR('/transactions?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
     let {data: inbounds, mutate: refreshInbounds} = useSWR('/inbounds?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

    const users = useMemo(() => inbounds?.flatMap(i => i.settings?.clients ?? []) ?? [], [inbounds]);

    const addTransaction = useCallback(async (e) => {
        try {
            e?.preventDefault();
            let result = serverRequest(context.server, `/transactions`, {
                ...newTransaction
            });

            toast.success(`Transaction added successfull`);
            refreshList();
        }
        catch (err) {
            toast.error(err.message);
        }
    }, [newTransaction]);

    const removeTransaction = useCallback(async (/** @type {Transaction} */ t) => {
        await serverRequest(context.server, `/remove_transaction`, { id: t.id })
            .then(result => toast.success(`Transaction removed successful`))
            .then(() => refreshList())
            .catch(err => toast.error(err));
    }, []);

    const editTransaction = useCallback(async (/** @type {Transaction} */ t, field, value) => {
        await serverRequest(context.server, `/edit_transaction`, { id: t.id, field, value })
            .then(result => toast.success(`Transaction edited successful`))
            .then(() => refreshList())
            .catch(err => toast.error(err));
    }, []);

    transactions = transactions
        ?.filter(u => !view.user || u.user == view.user)
        ?.sort(arrSort(view.sortColumn, view.sortOrder == 'asc'));

    return <Container>
        <Head>
            <title>Transactions</title>
        </Head>
        {showAll ?
        <form onSubmit={addTransaction}>
            <FieldsGroup title="Add Transaction" className="mt-2 border-b-[1px] pb-3" horizontal={false} data={newTransaction} dataSetter={setNewTransaction}>
                <Field label={"User"} htmlFor="user">
                    <select className={styles.input} id="user">
                        <option value="">-</option>
                        {users.map((client, index) => <option key={index} value={client?.email}>{client?.email}</option>)}
                    </select>
                </Field>
                <Field label={"Description"} htmlFor="remark">
                    <input className={styles.input} id="remark" dir="rtl"/>
                </Field>
                <Field label={"Amount"} htmlFor="amount">
                    <input className={styles.input} id="amount" type={"text"}/>
                </Field>
                <Field label="-">
                    <button type={"submit"} className={styles.button}>Add Transaction</button>
                </Field>
            </FieldsGroup>
        </form> : null }
        <div className="flex flex-col lg:flex-row">
            <FieldsGroup title="Billing" horizontal className="border-b-[1px] lg:border-b-0">
                <Field label="UnPaid" className="rounded-lg bg-red-100 px-3 items-center align-middle">
                    <Price value={transactions?.filter(x => (Number(x.amount) ?? 0) > 0).reduce((result, t) => result + (Number(t.amount) || 0), 0) ?? 0}/>
                </Field>
                <span className="text-lg font-bold px-2">-</span>
                <Field label="Paid" className="rounded-lg bg-green-100 px-3 items-center align-middle">
                    <Price value={transactions?.filter(x => (Number(x.amount) ?? 0) < 0).reduce((result, t) => result + (Math.abs(Number(t.amount)) || 0), 0) ?? 0}/>
                </Field>
                <span className="text-lg font-bold px-2">=</span>
                <Field label="Remain" className="rounded-lg bg-slate-100 px-3 items-center align-middle">
                    <Price value={transactions?.reduce((result, t) => result + (Number(t.amount) || 0), 0) ?? 0}/>
                </Field>
            </FieldsGroup>
            <FieldsGroup className="my-2" data={view} dataSetter={setView} title="View" horizontal>
                <Field htmlFor="fullTime" label="Full Time">
                    <input type={"checkbox"} id="fullTime"/>
                </Field>
                <Field htmlFor="sortColumn" label="Sort">
                    <select className={styles.input} id="sortColumn">
                        <option value="">-</option>
                        <option value="user">User</option>
                        <option value="remark">Remark</option>
                        <option value="amount">Amount</option>
                        <option value="createDate">Create Date</option>
                    </select>
                </Field>
                <Field htmlFor="sortOrder" label="Sort Order">
                    <select className={styles.input} id="sortOrder">
                        <option value="asc">ASC</option>
                        <option value="desc">DESC</option>
                    </select>
                </Field>
                <Field label={"User"} htmlFor="user">
                    <select className={styles.input} id="user">
                        <option value="">-</option>
                        {users.map((client, index) => <option key={index} value={client?.email}>{client?.email}</option>)}
                    </select>
                </Field>
            </FieldsGroup>
        </div>

        {/* <div className="flex flex-row px-3 py-3 border-t-[1px] overflow-auto">
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
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="filter" className={"py-1 pr-2 self-center font-semibold"}>Filter</label>                
                <input type={"text"} id="filter" className="border-gray-500 border-solid border-b-0 bg-slate-100 rounded-md invalid:border-red-500 invalid:ring-red-600 px-2 py-1 focus:outline-blue-500" onChange={e => setFilter(e.currentTarget.value)} value={filter}/>
            </div>
            <div className="flex flex-row px-1 text-sm">
                <label htmlFor="statusFilter" className={"self-center py-1 pr-2 pl-2 font-semibold"}>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.currentTarget.value)} id="statusFilter" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    {Object.keys(statusFilters).map((x, index) => <option key={index} value={x}>{x}</option>)}
                </select>
            </div>
        </div> */}
        <div className="">
        <table className="w-full text-sm">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(styles.tableHead)}>#</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': view.sortColumn == 'user'})}>User</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': view.sortColumn == 'remark'})}>Remark</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': view.sortColumn == 'amount'})}>Amount</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer', {'bg-slate-200': view.sortColumn == 'createDate'})}>Dates</th>
                    <th className={classNames(styles.tableHead)}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {transactions?.length == 0 ? <tr>
                    <td colSpan={5} className={"py-3 text-gray-400 text-center"}>No Transactions</td>
                </tr> : null}
                {!transactions ? <tr>
                    <td colSpan={5} className={"py-3 text-gray-400 text-center"}>Loading ...</td>
                </tr> : null}
                {transactions
                    ?.map(t => {
                    return <tr key={"transaction-" + t.id}>
                        <td className={classNames(styles.td, 'text-center')}>{t.id}</td>
                        <td className={styles.td}>
                            <Editable value={t.user} editable={showAll} onEdit={value => editTransaction(t, 'user', value)}>{t.user ?? '-'}</Editable>
                        </td>
                        <td className={styles.td}>
                            <Editable value={t.remark} onEdit={value => editTransaction(t, 'remark', value)} editable={showAll}>
                            {t.remark ?? '-'}
                            </Editable>
                        </td>
                        <td className={classNames(styles.td, 'text-center')}>
                            <Editable onEdit={value => editTransaction(t, 'amount', value)} value={t.amount} editable={showAll}>
                                <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t.amount ?? 0) >= 0, 'bg-green-50 text-green-700': (t.amount ?? 0) < 0 })}>
                                    <Price value={t.amount}/>
                                </span>
                            </Editable>
                        </td>
                        <td className={styles.td}>
                            <DateView containerClassName="text-center" precision={true} full={view.fullTime} date={t.createDate}/>
                        </td>
                        <td className={styles.td}>
                            <PopupMenu text="Actions">
                                {showAll?<PopupMenu.Item action={() => prompt(`Do you want to remove transaction ${t.id} ?`, `Remove`, () => removeTransaction(t))}>Delete</PopupMenu.Item>:null}
                            </PopupMenu>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        </div>
    </Container>
    
}