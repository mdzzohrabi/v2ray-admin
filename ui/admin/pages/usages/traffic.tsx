import { DatePicker } from "@common/components/date-picker";
import { Field, FieldsGroup } from "@common/components/fields";
import { Size } from "@common/components/size";
import { Table } from "@common/components/table";
import { usePrompt, useStoredState } from "@common/lib/hooks";
import { arrSort, queryString } from "@common/lib/util";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo } from 'react';
import { Container } from "../../components/container";
import { FieldServerNodes } from "../../components/field-server-nodes";
import { ServerNode } from "../../components/server-node";
import { useContextSWR, useUser } from "../../lib/hooks";
import { styles } from "../../lib/styles";

export default function TrafficUsagePage() {

    let router = useRouter();
    let email = router.query.user;
    let isEn = router.query.date == 'en';
    let dateLocale = isEn ? 'en-US' : 'fa-IR-u-nu-latn';
    let intl = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'short' });
    let now = new Date();
    let {access} = useUser();

    const dateParts = (date: Date) => ({
        year: intl.formatToParts(date).find(x => x.type == 'year')?.value,
        month: intl.formatToParts(date).find(x => x.type == 'month')?.value,
        day: intl.formatToParts(date).find(x => x.type == 'day')?.value,
    });

    let [view, setView] = useStoredState('usages-traffic-view-' + (email ?? 'all'), {
        showDetail: access('isAdmin') ? true : false,
        sortColumn: 'type',
        sortAsc: true,
        filter: '',
        direction: '',
        type: '',
        dateYear: dateParts(now).year,
        dateMonth: dateParts(now).month,
        dateDay: dateParts(now).day,
        zeroTraffic: false,
        top: 500,
        footer: true,
        serverNode: ''
    });

    // Filter by user
    useEffect(() => {
        if (email)
            setView({ ...view, filter: `=${email}`, type: 'user' });
    }, [email]);

    let {data: usages, mutate: refreshUsages, isValidating: isLoading} = useContextSWR<any>('/traffic' + queryString({ email }));
    const prompt = usePrompt();

    let dates = useMemo(() => Object.keys(usages ?? {}).map(x => new Date(x)), [usages]);

    let [years, months, days] = useMemo(() => {
        return [
            [...new Set(dates.map(d => new Intl.DateTimeFormat(dateLocale, { year: 'numeric' }).format(d)))].sort((a, b) => Number(a) > Number(b) ? 1 : -1),
            [...new Set(dates.map(d => new Intl.DateTimeFormat(dateLocale, { month: 'numeric' }).format(d)))].sort((a, b) => Number(a) > Number(b) ? 1 : -1),
            [...new Set(dates.map(d => new Intl.DateTimeFormat(dateLocale, { day: 'numeric' }).format(d)))].sort((a, b) => Number(a) > Number(b) ? 1 : -1)
        ];

    }, [dates]);

    return <Container>
        <Head>
            <title>Traffic Usages</title>
        </Head>
        <FieldsGroup title={"Daily Traffic Usages"} data={view} dataSetter={setView} className='items-center'>
            { email ? <Field label="User" className="border-x-[1px] px-3 mr-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg bg-yellow-100">{email}</span>
            </Field> : null }
            <FieldServerNodes/>
            {/* <DatePicker/> */}
            <Field label="Year" htmlFor="dateYear">
                <select id="dateYear" className={styles.input}>
                    <option value="">-</option>
                    {years.map(date => <option key={date} value={date}>{date}</option>)}
                </select>
            </Field>
            <Field label="Month" htmlFor="dateMonth">
                <select id="dateMonth" className={styles.input}>
                    <option value="">-</option>
                    {months.map(date => <option key={date} value={date}>{date}</option>)}
                </select>
            </Field>
            <Field label="Day" htmlFor="dateDay">
                <select id="dateDay" className={styles.input}>
                    <option value="">-</option>
                    {days.map(date => <option key={date} value={date}>{date}</option>)}
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
            {access('trafficUsage', 'list') ? <>
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
            </>
             : null }
            <Field label="Select Top" htmlFor="top">
                <input type={"number"} id="top" width={4} className={styles.input}/>
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
            <div className="flex flex-row items-center">
                {access('isAdmin') ? <button className={styles.button} onClick={() => refreshUsages()}>Reload</button> : null }
            </div>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <Table
            rows={Object.keys(usages ?? {})
            .filter(key => {
                let {year, month, day} = dateParts(new Date(key));
                return (
                    (!view.dateYear || view.dateYear == year) &&
                    (!view.dateMonth || view.dateMonth == month) &&
                    (!view.dateDay || view.dateDay == day)
                )
            })
            .flatMap(date => [ ...(
                usages[date]
                    .map(x => ({ date, ...x }))
                    .sort(arrSort(view.sortColumn, view.sortAsc))
                    .filter(x => !!view.serverNode ? view.serverNode == 'local' ? !x.server || x.server == 'local' : x.server == view.serverNode : true)
                    .filter(x => view.filter ? view.filter?.startsWith('=') ? x.name == view.filter.substring(1) : x.name.includes(view.filter) : true)
                    .filter(x => !!view.direction ? x.direction == view.direction : true)
                    .filter(x => !!view.type ? x.type == view.type : true)
                    .filter(x => view.zeroTraffic ? true : x.traffic > 0)
                    .slice(0, view.top)
                ) ])
            }
            groupBy={x => x.date}
            group={(date: string) => <tr className="bg-slate-50">
                <td></td>
                <td className="font-bold text-lg py-1 px-2">{intl.format(new Date(date))}</td>
                <td colSpan={4}></td>
            </tr>}
            groupFooter={(date, items) => 
                items.length > 1 ? <tr className="bg-slate-50">
                    <td></td>
                    <td colSpan={4} className='px-3 text-gray-400'>Day Total</td>
                    <td className="p-2 px-3 font-bold"><Size size={items.reduce((s, r) => s + r.traffic, 0)}/></td>
                </tr> : null
            }
            loading={isLoading}
            columns={[ 'Type', 'Server', 'Name', 'Direction', 'Traffic' ]}
            footer={items => {
                return <tr className="bg-slate-50">
                    <td></td>
                    <td colSpan={4} className='px-3 text-gray-400 font-bold'>Total</td>
                    <td className="p-2 px-3 font-bold"><Size size={items.reduce((s, r) => s + r.traffic, 0)}/></td>
                </tr>
            }}
            cells={x => [
                // Date
                x.type,
                <ServerNode serverId={x.server}/>,
                x.name,
                x.direction,
                <Size size={x.traffic}/>
            ]}
        />
    </Container>
    
}