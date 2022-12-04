// @ts-check
/// <reference types="../../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useContext, useState } from 'react';
import useSWR from 'swr';
import { AppContext } from "../../components/app-context";
import { Table } from "../../components/table";
import { Container } from "../../components/container";
import { Field, FieldsGroup } from "../../components/fields";
import { Info, Infos } from "../../components/info";
import { usePrompt } from "../../lib/hooks";
import { styles } from "../../lib/styles";
import { serverRequest } from "../../lib/util";
import { useMemo } from "react";

export default function UsageLogsPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let {all, user: email, from: fromOffset, to: toOffset, tag} = router.query;
    let showAll = all == '1';
    let [view, setView] = useState({
        search: '',
        page: 1
    });

    let [search, setSearch] = useState('');

    let fetchData = useMemo(() => {
        return serverRequest.bind(this, context.server);
    }, [context.server]);

    let doFilter = useCallback(() => {
        setSearch(view.search);
    }, [view]);

    /**
     * @type {import("swr").SWRResponse<any[]>}
     */
    let {data: logs, mutate: refreshData, isValidating: isLoading} = useSWR('/daily_usage_logs?email='+(email || '')+'&page='+view.page+'&q='+(search || '')+'&from='+fromOffset+'&to='+toOffset+'&tag='+(tag || '')+'&key=' + btoa(context.server.url), fetchData);
    const prompt = usePrompt();

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
                { view.page > 1 ? <button className={styles.button} onClick={() => setView({ ...view, page: view.page - 1 })}>Prev</button> : null }
                <button className={styles.button} onClick={() => setView({ ...view, page: view.page + 1 })}>Next</button>
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
            columns={[ 'Client', 'Time', 'Tag', 'Destination' ]}
            cells={log => [
                log.clientAddress,
                log.dateTime,
                log.route,
                log.destination
            ]}
            loading={isLoading}
        />
    </Container>
    
}