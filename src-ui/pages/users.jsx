// @ts-check
/// <reference types="../../types"/>
import Head from "next/head";
import { useRouter } from "next/router";
import React, { Fragment, useCallback, useContext, useState } from 'react';
import useSWR from 'swr';
import { AddUser } from "../components/add-user";
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { Copy } from "../components/copy";
import { DateView } from "../components/date-view";
import { serverRequest } from "../util";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let [isLoading, setLoading] = useState(false);
    let showAll = router.query.all == '1';

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
    let {data: inbounds, mutate: refreshInbounds} = useSWR('/inbounds', serverRequest.bind(this, context.server));

    /**
     * @type {import("swr").SWRResponse<{ [user: string]: { firstConnect?: Date, lastConnect?: Date }}>}
     */
    let {data: usages} = useSWR('/usages', serverRequest.bind(this, context.server));


    const showQRCode = useCallback(async (protocol, user) => {
        let config = await serverRequest(context.server, '/client_config?protocol=' + protocol, user).then(data => data.config)
        let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(config);
        window.open(link);
    }, [router]);

    return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <AddUser disabled={isLoading} onRefresh={refreshInbounds} setLoading={setLoading} protocols={inbounds?.map(i => i.protocol ?? '') ?? []}/>
        <table className="w-full">
            <thead>
                <tr>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">User</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">ID</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">First connect</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Last connect</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Client Config</th>
                </tr>
            </thead>
            <tbody>
                {!inbounds || isLoading ? <tr><td colSpan={5} className="px-3 py-4">Loading ...</td></tr> : inbounds.map(i => {
                    return <Fragment key={"inbound-" + i.protocol}>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={5} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol}</td>
                        </tr>
                        {i.settings?.clients?.map(u => {
                            if (!showAll && !u.email?.startsWith('user')) return;
                            return <tr key={u.id}>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">{u.email}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">{u.id}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={usages ? usages[u.email ?? '']?.firstConnect : null}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={usages ? usages[u.email ?? '']?.lastConnect : null}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span onClick={() => showQRCode(i.protocol, u)} className="cursor-pointer text-blue-700">QR Code</span>
                                    {' | '}
                                    <Copy data={() => serverRequest(context.server, '/client_config?protocol=' + i.protocol, u).then(data => data.config)}>Copy Config</Copy>
                                </td>
                            </tr>
                        })}
                    </Fragment>
                })}
            </tbody>
        </table>
    </Container>
    
}