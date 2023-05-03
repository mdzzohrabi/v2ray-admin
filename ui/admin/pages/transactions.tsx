import { DateView } from "@common/components/date-view";
import { Dialog, useDialog } from "@common/components/dialog";
import { Editable } from "@common/components/editable";
import { Field, FieldsGroup } from "@common/components/fields";
import { Loading } from "@common/components/loading";
import { PopupMenu } from "@common/components/popup-menu";
import { Price } from "@common/components/price";
import { Select } from "@common/components/select";
import { Table } from "@common/components/table";
import { usePrompt, useStoredState } from "@common/lib/hooks";
import { arrSort } from "@common/lib/util";
import { ArrowPathIcon, ArrowUpTrayIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import ExportJsonExcel from 'js-export-excel';
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { useContextSWR, useUser } from "../lib/hooks";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";

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
                <button type={"submit"} className={styles.button}>
                    <PlusIcon className="w-4"/>
                    Add Transaction
                </button>
            </Field>
        </FieldsGroup>
    </Dialog>
}

export default function TransactionsPage() {

    let {server} = useContext(AppContext);
    let router = useRouter();

    let [view, setView] = useStoredState('transactions-view', {
        fullTime: true,
        user: router.query.user,
        sortColumn: 'createDate',
        sortOrder: 'desc',
        group: true
    });

    let {access} = useUser();

    useEffect(() => {
        if (router.query.user)
            setView({ ...view, user: router.query.user });
    }, [router.query.user]);
    
    let [expanded, setExpanded] = useStoredState('expanded-transactions', { });

    const prompt = usePrompt();

    let {data: transactions, mutate: refreshList, isValidating: isLoading} = useContextSWR<Transaction[]>('/transactions');
    let {data: nodes, mutate: refreshNodes} = useContextSWR<ServerNode[]>('/nodes');
    let {data: users, mutate: refreshUsers} = useContextSWR<string[]>('/inbounds_clients');
    let {data: admins} = useContextSWR<{ id: string, username: string }[]>('/system/users?fields=id,username');

    const addTransaction = useCallback(async (newTransaction) => {
        try {
            let result = serverRequest(server, `/transactions`, {
                ...newTransaction
            });

            toast.success(`Transaction added successfull`);
            refreshList();
        }
        catch (err) {
            toast.error(err.message);
        }
    }, [refreshList, server]);

    const removeTransaction = useCallback(async (t: Transaction) => {
        await serverRequest(server, `/remove_transaction`, { id: t.id })
            .then(result => toast.success(`Transaction removed successful`))
            .then(() => refreshList())
            .catch(err => toast.error(err));
    }, [server]);

    const editTransaction = useCallback(async (t: Transaction, field: string, value: any) => {
        await serverRequest(server, `/edit_transaction`, { id: t.id, field, value })
            .then(result => toast.success(`Transaction edited successful`))
            .then(() => refreshList())
            .catch(err => toast.error(err));
    }, [server]);

    const transactionDialog = useDialog((users, onSubmit, dismiss?: Function) => <AddTransactionDialog users={users} onSubmit={onSubmit} dismiss={dismiss}/>);

    let remain = 0;
    transactions = transactions
        ?.sort(arrSort('createDate', true, value => new Date(value.replace(' ', ' '))))

        ?.map(t => {
            remain += (Number(t.amount) ?? 0);
            return { ...t, remain };
        })
        ?.filter(u => !view.user || u.user == view.user)
        ?.sort(arrSort(view.sortColumn, view.sortOrder == 'asc', value => {
            if (view.sortColumn == 'createDate')
                return new Date(value.replace(' ', ' '));
            return value;
        }))
    ;

    const exportExcel = useCallback(() => {
        console.log('Export Excel');
        let intl = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
            timeStyle: 'medium',
            dateStyle: 'full'
        });
        let excel = new ExportJsonExcel({
            fileName: 'V2Ray-Transactions',
            datas: [
                {
                    sheetData: transactions?.map(x => ({
                        Date: intl.format(new Date(x.createDate)),
                        User: x.user,
                        Remark: x.remark,
                        Dept: Number(x.amount) > 0 ? Number(x.amount) : 0,
                        Paid: Number(x.amount) < 0 ? Number(x.amount) : 0,
                        Remain: x['remain'],
                        Creator: x.createdBy
                    })),
                    sheetName: 'Transactions',
                    sheetHeader: [
                        'Date',
                        'User',
                        'Remark',
                        'Dept',
                        'Paid',
                        'Remain',
                        'Creator'
                    ]
                }
            ]
        })
        excel.saveExcel();
    }, [transactions]);

    return <Container>
        <Head>
            <title>Transactions</title>
        </Head>
        <div className="flex flex-col lg:flex-col">
            <FieldsGroup title="Billing" horizontal className="border-b-[1px] lg:border-b-0 items-center" containerClassName="items-center">
                <Field label="UnPaid" className="rounded-lg bg-red-100 px-6 items-center align-middle whitespace-nowrap">
                    <Price value={transactions?.filter(x => (Number(x.amount) ?? 0) > 0).reduce((result, t) => result + (Number(t.amount) || 0), 0) ?? 0}/>
                </Field>
                <span className="text-lg font-bold px-2">-</span>
                <Field label="Paid" className="rounded-lg bg-green-100 px-6 items-center align-middle whitespace-nowrap">
                    <Price value={transactions?.filter(x => (Number(x.amount) ?? 0) < 0).reduce((result, t) => result + (Math.abs(Number(t.amount)) || 0), 0) ?? 0}/>
                </Field>
                <span className="text-lg font-bold px-2">=</span>
                <Field label="Remain" className="rounded-lg bg-slate-100 px-6 items-center align-middle whitespace-nowrap">
                    <Price value={transactions?.reduce((result, t) => result + (Number(t.amount) || 0), 0) ?? 0}/>
                </Field>
                <div className="ml-auto mr-2 flex flex-row">
                    <button className={styles.buttonItem} onClick={exportExcel}><ArrowUpTrayIcon className="w-4"/> Export Excel</button>
                    {access('transactions', 'add') ? <button className={styles.buttonItem} onClick={() => transactionDialog.show(users, addTransaction)}>
                        <PlusIcon className="w-4"/>
                        Add Transaction
                    </button> : null}
                    <button className={styles.buttonItem} onClick={() => refreshList()}>
                        <ArrowPathIcon className="w-4"/>
                        Refresh
                    </button>
                </div>
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
                    <Select
                        items={users ?? []}  
                    />
                </Field>
            </FieldsGroup>
        </div>
        <Loading isLoading={isLoading}/>
        <Table
            className="border-separate border-spacing-0"
            rows={transactions ?? []}
            columns={[ 'User', 'Remark', 'Debt', 'Paid', 'Remain', 'Node Server', 'Creator', 'Created For', 'Dates', 'Actions' ]}
            groupBy={t => {
                try {
                    return !view.group ? null : t.createDate ? new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(new Date(t.createDate.replace(' ', ' '))) : null;
                } catch (err) {
                    console.error(err);
                    return 'Bad Group';
                }
            }}
            group={(monthName: string) => <tr>
                <td onClick={() => setExpanded({ ...expanded, [monthName]: !expanded[monthName] })} className="cursor-pointer py-2 px-6 text-lg font-bold sticky z-10 bg-zinc-50 top-[1.8rem] xl:top-[1.8rem] border-b-2 border-t-2 border-t-gray-400" colSpan={11}>
                    <span className="font-bold w-7 text-center py-0 mr-4 inline-block rounded-full bg-gray-200 text-lg select-none text-gray-500">{expanded[monthName] ? '-' : '+'}</span>
                    {monthName}
                </td>
            </tr>}
            groupFooter={(group, items) => 
                <tr className="bg-slate-50">
                    <td className="py-2 px-6 text-md" colSpan={3}></td>
                    <td className="py-2 px-6 text-md">
                        <Price value={items.filter(t => Number(t.amount) > 0).reduce((r, t) => r + (Number(t.amount) || 0), 0)}/>
                    </td>
                    <td className="py-2 px-6 text-md">
                        <span className="px-2">-</span>
                        <Price value={items.filter(t => Number(t.amount) < 0).reduce((r, t) => r + (Math.abs(Number(t.amount)) || 0), 0)}/>
                    </td>
                    <td className="font-bold">
                        <span className="px-2">=</span>
                        <Price value={
                            items.filter(t => Number(t.amount) > 0).reduce((r, t) => r + (Number(t.amount) || 0), 0) -
                            items.filter(t => Number(t.amount) < 0).reduce((r, t) => r + (Math.abs(Number(t.amount)) || 0), 0)
                        }/>
                    </td>
                    <td className="py-2 px-6 text-md font-bold" colSpan={54}></td>
                </tr>
            }
            rowContainer={(row, elRow, group) => !view.group || expanded[group] ? elRow :  null}
            cells={t => [
                // User
                <Editable items={users} value={t.user} editable={access('transactions', 'edit')} onEdit={value => editTransaction(t, 'user', value)}>{t.user ?? '-'}</Editable>,
                // Remark
                <Editable value={t.remark} onEdit={value => editTransaction(t, 'remark', value)} editable={access('transactions', 'edit')}>
                {t.remark ?? '-'}
                </Editable>,
                // Dept
                (t.amount ?? 0) >= 0 ?
                <Editable onEdit={value => editTransaction(t, 'amount', value)} value={t.amount} editable={access('transactions', 'edit')}>
                    <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t.amount ?? 0) >= 0, 'bg-green-50 text-green-700': (t.amount ?? 0) < 0 })}>
                        <Price value={t.amount}/>
                    </span>
                </Editable> : '-',
                // Paid
                (t.amount ?? 0) < 0 ?
                <Editable onEdit={value => editTransaction(t, 'amount', value)} value={t.amount} editable={access('transactions', 'edit')}>
                    <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t.amount ?? 0) >= 0, 'bg-green-50 text-green-700': (t.amount ?? 0) < 0 })}>
                        <Price value={Math.abs(Number(t.amount) ?? 0)}/>
                    </span>
                </Editable> : '-',
                // Remain
                <span className={classNames("rounded-lg inline-block px-2 text-rtl", { 'bg-red-50 text-red-700': (t['remain'] ?? 0) >= 0, 'bg-green-50 text-green-700': (t['remain'] ?? 0) < 0 })}>
                    <Price value={t['remain']}/>
                </span>,
                // Node
                t.serverNodeId ? nodes?.find(x => x.id == t.serverNodeId)?.name : '-',
                <Editable items={admins?.map(x => x.username)} value={t.createdBy ?? ''} onEdit={value => editTransaction(t, 'createdBy', value)} editable={access('transactions', 'edit')}>
                    {t.createdBy ?? '-'}
                </Editable>,
                <Editable items={admins?.map(x => x.username)} value={t.createdFor ?? ''} onEdit={value => editTransaction(t, 'createdFor', value)} editable={access('transactions', 'edit')}>
                    {t.createdFor ?? '-'}
                </Editable>,
                // Date
                <DateView containerClassName="text-center" precision={true} full={view.fullTime} date={t.createDate?.replace(' ', ' ')}/>,
                // Action
                <PopupMenu text="Actions">
                    <PopupMenu.Item icon={<TrashIcon className="w-4"/>} visible={access('transactions', 'delete')} action={() => prompt(`Do you want to remove transaction "${t.remark}" ?`, `Remove`, () => removeTransaction(t))}>
                        Delete
                    </PopupMenu.Item>
                </PopupMenu>
            ]}
        />
    </Container>
    
}