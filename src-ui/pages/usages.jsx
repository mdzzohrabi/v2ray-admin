// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext, useState } from 'react';
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { usePrompt } from "../lib/hooks";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";

export default function UsagesPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    let email = router.query.user;
    let [view, setView] = useState({
        showDetail: showAll ? true : false
    });

    /**
     * @type {import("swr").SWRResponse<any[]>}
     */
    let {data: usages, mutate: refreshUsages, isValidating: isLoading} = useSWR('/daily_usages?email='+email+'&key=' + btoa(context.server.url), serverRequest.bind(this, context.server));
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
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <div className="">
        <table className="w-full text-sm">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(styles.tableHead)}>#</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Date</th>
                    {/* <th className={classNames(styles.tableHead, 'cursor-pointer')}>User / FullName</th> */}
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>First Connect</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Last Connect</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Requests</th>
                </tr>
            </thead>
            <tbody>
                {!usages ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : usages.map((x, index) => {
                    return <tr key={x.date} className={classNames("text-[0.78rem]", 'odd:bg-gray-50')}>
                        <td className={styles.td}>{index + 1}</td>
                        <td className={styles.td}>{x.date}</td>
                        {/* <td className={styles.td}>{x.email}</td>     */}
                        <td className={styles.td}>
                            {view.showDetail ? 
                            <Infos>
                                {x.outbounds.map(o => {
                                    return <Info label={o.tag}>{new Date(o.firstConnect).toLocaleTimeString()}</Info>
                                })}
                            </Infos> : x.outbounds.filter(o => o.tag == 'direct').map(o => new Date(o.firstConnect).toLocaleTimeString()).pop() }
                        </td>
                        <td className={styles.td}>
                            {view.showDetail ?
                            <Infos>
                                {x.outbounds.map(o => {
                                    return <Info label={o.tag}>{new Date(o.lastConnect).toLocaleTimeString()}</Info>
                                })}
                            </Infos>
                            : x.outbounds.filter(o => o.tag == "direct").map(o => new Date(o.lastConnect).toLocaleTimeString()).pop() }
                        </td>
                        <td className={styles.td}>
                            {view.showDetail ?
                            <Infos>
                                {x.outbounds.map(o => {
                                    return <Info label={o.tag}>{o.counter} requests</Info>
                                })}
                            </Infos>
                            : x.outbounds.filter(o => o.tag == "direct").map(o => `${o.counter} requests`).pop()}
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        </div>
    </Container>
    
}