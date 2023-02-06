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
import { Dialog, useDialog } from "../components/dialog";
import { Editable } from "../components/editable";
import { Field, FieldsGroup } from "../components/fields";
import { PopupMenu } from "../components/popup-menu";
import { Price } from "../components/price";
import { Table } from "../components/table";
import { usePrompt, useStoredState } from "../lib/hooks";
import { styles } from "../lib/styles";
import { arrSort, queryString, serverRequest } from "../lib/util";

/**
 * 
 * @param {{
 *      dismiss?: Function,
 *      onSubmit?: (transaction: Partial<Transaction) => any,
 *      users?: string[]
 * }} param0 
 * @returns 
 */
export function AddTransactionDialog({ onSubmit, users, dismiss }) {

    let [newTransaction, setNewTransaction] = useState({});
    let addTransaction = useCallback((e) => {
        e?.preventDefault();
        onSubmit?.call(this, newTransaction);
        if (dismiss) dismiss();
    }, [newTransaction, setNewTransaction])

    return <Dialog onClose={dismiss} title={'New Transaction'} onSubmit={addTransaction}>
        <FieldsGroup layoutVertical className="mt-2 pb-3" data={newTransaction} dataSetter={setNewTransaction}>
            <Field label={"User"} htmlFor="user">
                <select className={styles.input} id="user">
                    <option value="">-</option>
                    {(users ?? []).map((client, index) => <option key={index} value={client}>{client}</option>)}
                </select>
            </Field>
            <Field label={"Description"} htmlFor="remark">
                <input className={styles.input} id="remark" dir="rtl"/>
            </Field>
            <Field label={"Amount"} htmlFor="amount">
                <input className={styles.input} id="amount" type={"text"}/>
            </Field>
            <Field className="pr-4 pt-4" horizontal={false}>
                <button type={"submit"} className={styles.button}>Add Transaction</button>
            </Field>
        </FieldsGroup>
    </Dialog>
}

export default function TransactionsPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    // /** @type {[Partial<Transaction>, React.Dispatch<React.SetStateAction<Partial<Transaction>>>]} */
    // let [newTransaction, setNewTransaction] = useState({});
    let [view, setView] = useStoredState('transactions-view', {
        fullTime: true,
        user: router.query.user,
        sortColumn: '',
        sortOrder: 'asc',
        group: true
    });
    
    let [expanded, setExpanded] = useStoredState('expanded-transactions', {

    });

    const prompt = usePrompt();

    /**
     * @type {import("swr").SWRResponse<Transaction[]>}
     */
    let {data: transactions, mutate: refreshList, isValidating: isLoading} = useSWR('/transactions?key=' + btoa(context.server.url), serverRequest.bind(this, context.server));

    /**
     * @type {import("swr").SWRResponse<string[]>}
     */
     let {data: users, mutate: refreshUsers} = useSWR('/inbounds_clients' + queryString({
        key: btoa(context.server.url),
        showAll
     }), serverRequest.bind(this, context.server));

    const addTransaction = useCallback(async (newTransaction) => {
        try {
            let result = serverRequest(context.server, `/transactions`, {
                ...newTransaction
            });

            toast.success(`Transaction added successfull`);
            refreshList();
        }
        catch (err) {
            toast.error(err.message);
        }
    }, [refreshList, context?.server]);

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

    const transactionDialog = useDialog((users, onSubmit, dismiss) => <AddTransactionDialog users={users} onSubmit={onSubmit} dismiss={dismiss}/>);

    let remain = 0;
    transactions = transactions
        ?.map(t => {
            remain += (Number(t.amount) ?? 0);
            return { ...t, remain };
        })
        ?.filter(u => !view.user || u.user == view.user)
        ?.sort(arrSort(view.sortColumn, view.sortOrder == 'asc', value => {
            if (view.sortColumn == 'createDate')
                return new Date(value);
            return value;
        }));

    return <Container>
        <Head>
            <title>Transactions</title>
        </Head>
        <div className="flex flex-col lg:flex-col">
            <FieldsGroup title="Billing" horizontal className="border-b-[1px] lg:border-b-0">
                <Field label="UnPaid" className="rounded-lg bg-red-100 px-4 items-center align-middle whitespace-nowrap">
                    <Price value={transactions?.filter(x => (Number(x.amount) ?? 0) > 0).reduce((result, t) => result + (Number(t.amount) || 0), 0) ?? 0}/>
                </Field>
                <span className="text-lg font-bold px-2">-</span>
                <Field label="Paid" className="rounded-lg bg-green-100 px-4 items-center align-middle whitespace-nowrap">
                    <Price value={transactions?.filter(x => (Number(x.amount) ?? 0) < 0).reduce((result, t) => result + (Math.abs(Number(t.amount)) || 0), 0) ?? 0}/>
                </Field>
                <span className="text-lg font-bold px-2">=</span>
                <Field label="Remain" className="rounded-lg bg-slate-100 px-4 items-center align-middle whitespace-nowrap">
                    <Price value={transactions?.reduce((result, t) => result + (Number(t.amount) || 0), 0) ?? 0}/>
                </Field>
                {showAll ? <button className={styles.button} onClick={() => transactionDialog.show(users, addTransaction)}>Add Transaction</button> : null}
                <button className={styles.button} onClick={() => refreshList()}>Refresh</button>
            </FieldsGroup>
            <FieldsGroup className="my-2" data={view} dataSetter={setView} title="View" horizontal>
                <Field htmlFor="fullTime" label="Full Time">
                    <input type={"checkbox"} id="fullTime"/>
                </Field>
                <Field htmlFor="group" label="Group" className="px-[.75rem] mx-2 border-x-2">
                    <input type={"checkbox"} id="group"/>
                </Field>
                <Field htmlFor="sortColumn" label="Sort">
                    <select className={styles.input} id="sortColumn">
                        <option value="">-</option>
                        <option value="id">ID</option>
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
                        {(users ??[]).map((client, index) => <option key={index} value={client}>{client}</option>)}
                    </select>
                </Field>
            </FieldsGroup>
        </div>
        {isLoading ? <div className="fixed bg-slate-900 text-white z-50 rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <Table
            className="border-separate border-spacing-0"
            rows={transactions ?? []}
            columns={[ 'User', 'Remark', 'Debt', 'Paid', 'Remain', 'Dates', 'Actions' ]}
            groupBy={t => !view.group ? null : t.createDate ? new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(new Date(t.createDate.replace(' ', ''))) : null}
            group={monthName => <tr>
                <td onClick={() => setExpanded({ ...expanded, [monthName]: !expanded[monthName] })} className="cursor-pointer py-2 px-6 text-lg font-bold sticky z-10 bg-zinc-50 top-[1.8rem] xl:top-[1.8rem] border-b-2 border-t-2 border-t-gray-400" colSpan={9}>
                    <span className="font-bold w-7 text-center py-0 mr-4 inline-block rounded-full bg-gray-200 text-lg select-none text-gray-500">{expanded[monthName] ? '-' : '+'}</span>
                    {monthName}
                </td>
            </tr>}
            groupFooter={(group, items) => 
                <tr className="bg-slate-50">
                    <td className="py-2 px-6 text-md font-bold" colSpan={4}></td>
                    <td className="py-2 px-6 text-md font-bold">
                        <Price value={items.filter(t => Number(t.amount) > 0).reduce((r, t) => r + (Number(t.amount) || 0), 0)}/>
                    </td>
                    <td className="py-2 px-6 text-md font-bold">
                        <Price value={items.filter(t => Number(t.amount) < 0).reduce((r, t) => r + (Math.abs(Number(t.amount)) || 0), 0)}/>
                    </td>
                    <td className="py-2 px-6 text-md font-bold" colSpan={3}></td>
                </tr>
            }
            rowContainer={(row, elRow, group) => !view.group || expanded[group] ? elRow :  null}
            cells={t => [
                // User
                <Editable value={t.user} editable={showAll} onEdit={value => editTransaction(t, 'user', value)}>{t.user ?? '-'}</Editable>,
                // Remark
                <Editable value={t.remark} onEdit={value => editTransaction(t, 'remark', value)} editable={showAll}>
                {t.remark ?? '-'}
                </Editable>,
                // Dept
                (t.amount ?? 0) >= 0 ?
                <Editable onEdit={value => editTransaction(t, 'amount', value)} value={t.amount} editable={showAll}>
                    <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t.amount ?? 0) >= 0, 'bg-green-50 text-green-700': (t.amount ?? 0) < 0 })}>
                        <Price value={t.amount}/>
                    </span>
                </Editable> : null,
                // Paid
                (t.amount ?? 0) < 0 ?
                <Editable onEdit={value => editTransaction(t, 'amount', value)} value={t.amount} editable={showAll}>
                    <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t.amount ?? 0) >= 0, 'bg-green-50 text-green-700': (t.amount ?? 0) < 0 })}>
                        <Price value={Math.abs(Number(t.amount) ?? 0)}/>
                    </span>
                </Editable> : null,
                // Remain
                <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t['remain'] ?? 0) >= 0, 'bg-green-50 text-green-700': (t['remain'] ?? 0) < 0 })}>
                    <Price value={t['remain']}/>
                </span>,
                // Date
                <DateView containerClassName="text-center" precision={true} full={view.fullTime} date={t.createDate}/>,
                // Action
                <PopupMenu text="Actions">
                    {showAll?<PopupMenu.Item action={() => prompt(`Do you want to remove transaction "${t.remark}" ?`, `Remove`, () => removeTransaction(t))}>Delete</PopupMenu.Item>:null}
                </PopupMenu>
            ]}
        />
    </Container>
    
}