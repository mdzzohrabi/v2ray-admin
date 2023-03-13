// @ts-check
/// <reference types="../../../types"/>
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useContext, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AppContext } from "../../components/app-context";
import { Container } from "../../components/container";
import { DateView } from "../../components/date-view";
import { Field, FieldsGroup } from "../../components/fields";
import { Table } from "../../components/table";
import { styles } from "../../lib/styles";
import { queryString, serverRequest } from "../../lib/util";

export default function UsageLogsPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let {all, user: email, from: fromOffset, to: toOffset, tag} = router.query;
    let showAll = all == '1';
    let [view, setView] = useState({
        search: '',
        page: 1,
        limit: 50
    });

    let [search, setSearch] = useState('');

    let fetchData = useMemo(() => serverRequest.bind(this, context.server), [context.server]);

    let doFilter = useCallback(() => {
        setSearch(view.search);
    }, [view]);

    let {data: logs, mutate: refreshData, isValidating: isLoading} = useSWR<any[]>(email ? '/daily_usage_logs' + queryString({
        email,
        page: view.page,
        q: search,
        from: fromOffset,
        to: toOffset,
        tag,
        key: btoa(context.server.url),
        limit: view.limit
    }) : null, fetchData);

    return <Container>
        <Head>
            <title>Usages</title>
        </Head>
        <FieldsGroup title={"Daily Usages Logs"} data={view} dataSetter={setView} horizontal>
            <Field label="User" className="border-x-[1px] px-3 mr-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg bg-yellow-100">{email}</span>
            </Field>
            <Field label="Tag" className="border-r-[1px] px-3 mr-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg bg-yellow-100">{tag}</span>
            </Field>
            <Field label="Page" className="border-r-[1px] px-3 mr-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg bg-yellow-100">{view.page}</span>
                <button disabled={view.page <= 1} className={styles.button} onClick={() => setView({ ...view, page: view.page - 1 })}>Prev</button>
                <button className={styles.button} onClick={() => setView({ ...view, page: view.page + 1 })}>Next</button>
            </Field>
            <Field htmlFor="limit" label="Limit">
                <select id="limit" className={styles.input}>
                    <option value="10">10</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </Field>
            <Field htmlFor="search" label="Search">
                <input className={styles.input} type="text" id="search" placeholder="Destination Search ..."/>
            </Field>
            <div>
                <button className={styles.button} onClick={doFilter}>Filter</button>
            </div>
        </FieldsGroup>
        <Table
            rows={logs ?? []}
            columns={[ 'Offset', 'Client', 'Time', 'Tag', 'Destination' ]}
            index={(log, index) => index + 1 + ((view.page - 1) * view.limit)}
            cells={log => [
                log.offset,
                log.clientAddress,
                <DateView date={log.dateTime} full={true} locale='en'/>,
                log.route,
                log.destination
            ]}
            loading={isLoading}
        />
    </Container>
    
}