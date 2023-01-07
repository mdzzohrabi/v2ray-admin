// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext } from 'react';
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { DateView } from "../components/date-view";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { Table } from "../components/table";
import { usePrompt, useStoredState } from "../lib/hooks";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";

export default function UsagesPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    let email = router.query.user;
    let [view, setView] = useStoredState('usages-view', {
        showDetail: showAll ? true : false
    });

    /**
     * @type {import("swr").SWRResponse<any[]>}
     */
    let {data: usages, mutate: refreshUsages, isValidating: isLoading} = useSWR(email ? '/daily_usages?email='+email+'&key=' + btoa(context.server.url) : null, serverRequest.bind(this, context.server));
    const prompt = usePrompt();

    return <Container>
        <Head>
            <title>Usages</title>
        </Head>
        <FieldsGroup title={"Daily Usages"} data={view} dataSetter={setView} horizontal>
            <Field label="User" className="border-x-[1px] px-3 mr-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg bg-yellow-100">{email}</span>
            </Field>
            {showAll?<Field label="Show Detail" htmlFor="showDetail">
                <input type="checkbox" id="showDetail" />
            </Field>:null}
        </FieldsGroup>
        <Table
            rows={usages ?? []}
            loading={isLoading}
            groupBy={x => new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric'}).format(new Date(x.date))}
            group={monthName => <tr className="sticky top-[31px] z-50 bg-white shadow-sm">
                <td colSpan={5} className={'px-10 py-2 text-base font-bold'}>{monthName}</td>
            </tr>}
            columns={[ 'Date', 'First connect', 'Last connect', 'Requests' ]}
            cells={x => [
                // Date
                <DateView options={{ dateStyle: 'full' }} date={x.date} full={true} containerClassName="text-center"/>,
                // First connect
                view.showDetail ? 
                <Infos>
                    {x.outbounds.map(o => {
                        return <Info label={o.tag}>{new Date(o.firstConnect).toLocaleTimeString()}</Info>
                    })}
                </Infos> : x.outbounds.filter(o => o.tag == 'direct').map(o => new Date(o.firstConnect).toLocaleTimeString()).pop(),
                // Last connect
                view.showDetail ?
                <Infos>
                    {x.outbounds.map(o => {
                        return <Info label={o.tag}>{new Date(o.lastConnect).toLocaleTimeString()}</Info>
                    })}
                </Infos>
                : x.outbounds.filter(o => o.tag == "direct").map(o => new Date(o.lastConnect).toLocaleTimeString()).pop(),
                // Requests
                view.showDetail ?
                <Infos>
                    {x.outbounds.map(o => {
                        return <Info label={o.tag}>
                            {o.counter} requests 
                            {showAll ? 
                                <a className={classNames(styles.link, 'pl-2')} href={`/usages/logs?all=${showAll?1:0}&user=${email}&tag=${o.tag}&from=${o.firstConnectLogOffset}&to=${o.lastConnectLogOffset}`}> (Logs)</a> : null}
                        </Info>
                    })}
                </Infos>
                : x.outbounds.filter(o => o.tag == "direct").map(o => `${o.counter} requests`).pop()
            ]}
        />
    </Container>
    
}