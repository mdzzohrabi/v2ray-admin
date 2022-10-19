// @ts-check
/// <reference types="../../types"/>
import { Container } from "../components/container";
import useSWR from 'swr';
import { serverRequest } from "../util";
import { DateView } from "../components/date-view";
import { Copy } from "../components/copy";
import React, { useCallback, useContext, useRef, useState } from 'react';
import classNames from "classnames";
import Head from "next/head";
import { AppContext } from "../components/app-context";
import { useRouter } from "next/router";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();

    let [isLoading, setLoading] = useState(false);
    let [username, setUsername] = useState('');
    let [protocol, setProtocol] = useState('');
    let [message, setMessage] = useState('');
    let [error, setError] = useState('');
    let showAll = router.query.all == '1';

    /**
     * @type {import("swr").SWRResponse<V2RayConfigInbound[]>}
     */
    let {data: inbounds, mutate: refreshInbounds} = useSWR('/inbounds', serverRequest.bind(this, context.server));

    /**
     * @type {import("swr").SWRResponse<{ [user: string]: { firstConnect?: Date, lastConnect?: Date }}>}
     */
    let {data: usages} = useSWR('/usages', serverRequest.bind(this, context.server));


    const addUser = useCallback(async () => {
        try {
            setError('');
            setMessage('');
            setLoading(true);
            let result = await serverRequest(context.server, '/user', {
                email: username, protocol
            });
            if (result.error) {
                setError(result.error);
            } else {
                setUsername('');
                refreshInbounds();
                setMessage('User added');
            }
        }
        catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }

    }, [username, protocol, refreshInbounds, setError, setMessage]);

    const showQRCode = useCallback(async (protocol, user) => {
        let config = await serverRequest(context.server, '/client_config?protocol=' + protocol, user).then(data => data.config)
        let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(config);
        window.open(link);
    }, [router]);

    return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <div className="flex my-3">
            <h2 className="font-bold px-3 py-3 whitespace-nowrap">Add User</h2>
            <div className="self-center flex-nowrap flex">
                <label htmlFor="userName" className="px-3 self-center">Username</label>
                <input value={username} onChange={(e) => setUsername(e.currentTarget.value)} disabled={isLoading} className="border-gray-500 border-solid border-2 rounded-md" type="text" id="userName"/>
                <label htmlFor="protocol" className="px-3 self-center">Protocol</label>
                <input value={protocol} onChange={(e) => setProtocol(e.currentTarget.value)} disabled={isLoading} className="border-gray-500 border-solid border-2 rounded-md" type="text" id="protocol"/>
                <button onClick={() => addUser()} disabled={isLoading} type="button" className="bg-slate-300 whitespace-nowrap rounded-lg px-3 py-1 ml-2 delay-200 hover:bg-blue-300">Add User</button>
                { message || error ?
                <div className={classNames("message px-3 py-2 bg-slate-100 mt-2 rounded-md text-sm", { 'bg-red-100': !!error })}>{message || error}</div> : null }
            </div>
        </div>

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
                    return <>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={5} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol}</td>
                        </tr>
                        {i.settings?.clients?.map(u => {
                            if (!showAll && u.email?.startsWith('user')) return;
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
                    </>
                })}
            </tbody>
        </table>
    </Container>
    
}