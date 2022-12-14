// @ts-check
/// <reference types="../../../types"/>
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext } from 'react';
import useSWR from 'swr';
import { AppContext } from "../../components/app-context";
import { Container } from "../../components/container";
import { Field, FieldsGroup } from "../../components/fields";
import { Size } from "../../components/size";
import { Table } from "../../components/table";
import { usePrompt, useStoredState } from "../../lib/hooks";
import { styles } from "../../lib/styles";
import { arrSort, queryString, serverRequest } from "../../lib/util";

export default function TrafficUsagePage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    let email = router.query.user;
    let [view, setView] = useStoredState('usages-traffic-view', {
        showDetail: showAll ? true : false,
        sortColumn: 'type',
        sortAsc: true,
        filter: '',
        direction: '',
        type: '',
        date: '',
        zeroTraffic: false,
        top: 500,
        footer: true
    });

    /**
     * @type {import("swr").SWRResponse<any>}
     */
    let {data: usages, mutate: refreshUsages, isValidating: isLoading} = useSWR('/traffic' + queryString({ email, key: btoa(context.server.url) }), serverRequest.bind(this, context.server));
    const prompt = usePrompt();

    return <Container>
        <Head>
            <title>Traffic Usages</title>
        </Head>
        <FieldsGroup title={"Daily Traffic Usages"} data={view} dataSetter={setView} horizontal>
            { email ? <Field label="User" className="border-x-[1px] px-3 mr-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg bg-yellow-100">{email}</span>
            </Field> : null }
            <Field label="Date" htmlFor="date">
                <select id="date" className={styles.input}>
                    <option value="">-</option>
                    {Object.keys(usages ?? {}).map(date => <option value={date}>{date}</option>)}
                </select>
            </Field>
            <Field label="Sort" htmlFor="sortColumn">
                <select id="sortColumn" className={styles.input}>
                    <option value="-">-</option>
                    <option value="type">Type</option>
                    <option value="name">Name</option>
                    <option value="direction">Direction</option>
                    <option value="traffic">Traffic</option>
                </select>
            </Field>
            <Field label="Order" htmlFor="sort-order">
                <select value={view?.sortAsc ? "asc" : "desc"} id="sort-order" className={styles.input} onChange={e => setView({ ...view, sortAsc: e.currentTarget.value == "asc" })}>
                    <option value={"asc"}>ASC</option>
                    <option value={"desc"}>DESC</option>
                </select>
            </Field>
            <Field label="Direction" htmlFor="direction">
                <select id="direction" className={styles.input}>
                    <option value={''}>-</option>
                    <option value="uplink">UpLink</option>
                    <option value="downlink">DownLink</option>
                </select>
            </Field>
            <Field label="Type" htmlFor="type">
                <select id="type" className={styles.input}>
                    <option value={''}>-</option>
                    <option value="user">User</option>
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                </select>
            </Field>
            <Field label="Filter" htmlFor="filter">
                <input type={"text"} id="filter" className={styles.input}/>
            </Field>
            <Field label="Select Top" htmlFor="top">
                <input type={"number"} id="top" className={styles.input}/>
            </Field>
            <Field label="Zero Traffic" htmlFor="zeroTraffic">
                <input type={"checkbox"} id="zeroTraffic" className={styles.input}/>
            </Field>
            {/* <Field label="Status" htmlFor="status">
                <div className="flex gap-1 mb-1">
                    {view.statusFilter?.map((filter, index) => <span key={index} onClick={() => setView({ ...view, statusFilter: view.statusFilter.filter(x => x != filter)})} className={classNames("whitespace-nowrap bg-slate-200 px-3 py-1 rounded-3xl cursor-pointer hover:bg-slate-700 hover:text-white")}>{filter}</span> )}
                </div>
                <select value={"-"} onChange={e => setView({ ...view, statusFilter: [...view.statusFilter, e.currentTarget.value]})} id="statusFilter" className="bg-slate-100 rounded-lg px-2 py-1">
                    <option value="-">-</option>
                    {(statusFilters ?? []).map((x, index) => <option key={index} value={x}>{x}</option>)}
                </select>
            </Field> */}
            <div className="flex flex-row">
                {showAll ? <button className={styles.button} onClick={() => refreshUsages()}>Reload</button> : null }
            </div>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <Table
            rows={Object.keys(usages ?? {}).filter(date => !view.date || date == view.date).flatMap(date => [ ...(
                usages[date]
                    .map(x => ({ date, ...x }))
                    .sort(arrSort(view.sortColumn, view.sortAsc))
                    .filter(x => view.filter ? x.name.includes(view.filter) : true)
                    .filter(x => !!view.direction ? x.direction == view.direction : true)
                    .filter(x => !!view.type ? x.type == view.type : true)
                    .filter(x => view.zeroTraffic ? true : x.traffic > 0)
                    .slice(0, view.top)
                ) ])}
            groupBy={x => x.date}
            group={date => <tr className="bg-slate-50">
                <td></td>
                <td className="font-bold text-lg py-1 px-2">{date}</td>
                <td colSpan={3}></td>
            </tr>}
            groupFooter={(date, items) => 
                <tr className="bg-slate-50">
                    <td></td>
                    <td colSpan={3} className='px-3 text-gray-400'>Day Total</td>
                    <td className="p-2 px-3 font-bold"><Size size={items.reduce((s, r) => s + r.traffic, 0)}/></td>
                </tr>
            }
            loading={isLoading}
            columns={[ 'Type', 'Name', 'Direction', 'Traffic' ]}
            cells={x => [
                // Date
                x.type,
                x.name,
                x.direction,
                <Size size={x.traffic}/>
            ]}
        />
    </Container>
    
}