// @ts-check
/// <reference types="../../types"/>
import Head from "next/head";
import { useRouter } from "next/router";
import React, { Fragment, useCallback, useContext, useState } from 'react';
import toast from "react-hot-toast";
import useSWR from 'swr';
import { AddUser } from "../components/add-user";
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { Copy } from "../components/copy";
import { DateView } from "../components/date-view";
import { Editable } from "../components/editable";
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

    const setActive = useCallback(async (protocol, user, active) => {
        let result = await serverRequest(context.server, '/active', {email: user.email, protocol, active});
        if (result?.ok) {
            toast.success('Changes made successful');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot save changes');
        }
    }, [router]);

    const removeUser = useCallback(async (protocol, user) => {
        let result = await serverRequest(context.server, '/remove_user', {email: user.email, protocol});
        if (result?.ok) {
            toast.success('User removed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot remove user');
        }
    }, [router]);

    const setMaxConnection = useCallback(async (protocol, user, value) => {
        let result = await serverRequest(context.server, '/max_connections', {email: user.email, protocol, value});
        if (result?.ok) {
            toast.success('Max connection changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setUsername = useCallback(async (protocol, user, value) => {
        let result = await serverRequest(context.server, '/change_username', {email: user.email, protocol, value});
        if (result?.ok) {
            toast.success('Username changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
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
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Max Connections</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">DeActive Date</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">First connect</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Last connect</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Client Config</th>
                </tr>
            </thead>
            <tbody>
                {!inbounds || isLoading ? <tr><td colSpan={6} className="px-3 py-4">Loading ...</td></tr> : inbounds.map(i => {
                    return <Fragment key={"inbound-" + i.protocol}>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={6} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol}</td>
                        </tr>
                        {i.settings?.clients?.map(u => {
                            if (!showAll && !u.email?.startsWith('user')) return;
                            return <tr key={u.id}>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><Editable onEdit={value => setUsername(i.protocol, u, value)} value={u.email}>{u.email}</Editable></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">{u.id}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><Editable onEdit={value => setMaxConnection(i.protocol, u, value)} value={u.maxConnections ?? 2}>{u.maxConnections ?? 2}</Editable></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={u.deActiveDate}/><span className="block text-gray-500">{u.deActiveReason}</span></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={usages ? usages[u.email ?? '']?.firstConnect : null}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={usages ? usages[u.email ?? '']?.lastConnect : null}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span onClick={() => showQRCode(i.protocol, u)} className="text-sm cursor-pointer text-blue-700">QR Code</span>
                                    {' | '}
                                    <Copy data={() => serverRequest(context.server, '/client_config?protocol=' + i.protocol, u).then(data => data.config)}>Copy Config</Copy>
                                    {' | '}
                                    <span onClick={() => setActive(i.protocol, u, u.deActiveDate ? true : false)} className="text-sm cursor-pointer text-blue-700">{u.deActiveDate?'Active':'De-Active'}</span>
                                    {' | '}
                                    <span onClick={() => removeUser(i.protocol, u)} className="text-sm cursor-pointer text-blue-700">{'Remove'}</span>
                                </td>
                            </tr>
                        })}
                    </Fragment>
                })}
            </tbody>
        </table>
    </Container>
    
}