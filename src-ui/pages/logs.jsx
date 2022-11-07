// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { Fragment, useCallback, useContext, useMemo, useState } from 'react';
import toast from "react-hot-toast";
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { Copy } from "../components/copy";
import { DateView } from "../components/date-view";
import { Popup } from "../components/popup";
import { serverRequest } from "../util";
import { io } from "socket.io-client";

export default function LogPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let [isLoading, setLoading] = useState(false);
    let [logs, setLogs] = useState([]);
    let [isConnected, setConnected] = useState(false);
    let socket = useMemo(() => {
        let socket = io(context.server.url + '/logs');
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        return socket;
    }, [setConnected]);

    let headClass = 'px-1 py-2 border-b-2 border-b-blue-900';

    return <Container>
        <Head>
            <title>Logs ({isConnected ? 'Connected' : 'Disconnected'})</title>
        </Head>
        <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-md z-50">
                <tr>
                    <th className={classNames(headClass)}>#</th>
                    <th className={headClass}>Log</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th colSpan={2} className={classNames('py-1', { 'bg-green-300': isConnected, 'bg-red-300': !isConnected })}>{isConnected ? 'Connected' : 'Disconnected'}</th>
                </tr>
            </tbody>
            {/* <tbody>
                {isLoading ? <tr><td colSpan={10} className="px-3 py-4">Loading ...</td></tr> : inbounds.map(i => {
                    return <Fragment key={"inbound-" + i.protocol}>
                        <tr key={"inbound-" + i.protocol}>
                            <td colSpan={10} className="uppercase font-bold bg-slate-100 px-4 py-3">{i.protocol}</td>
                        </tr>
                        {[...(i.settings?.clients ?? [])].sort((a, b) => !sortColumn ? 0 : a[sortColumn] == b[sortColumn] ? 0 : a[sortColumn] < b[sortColumn] ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1)).filter(u => showAll || u.email?.startsWith('user')).map((u, index) => {
                            return <tr key={u.id} className="text-[0.78rem]">
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">{index + 1}</td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setUsername(i.protocol, u, value)} value={u.email}>{u.email}</Editable>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span className="block">{u.id}</span>
                                    <div className="block">
                                        <span onClick={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.protocol, u))} className="cursor-pointer text-blue-700">{'ReGenerate ID'}</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={u.createDate}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setMaxConnection(i.protocol, u, value)} value={u.maxConnections}>{u.maxConnections}</Editable>
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <Editable onEdit={value => setExpireDays(i.protocol, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                                </td>
                                <td className="border-b-2 py-1 px-3">
                                    <DateView date={u.deActiveDate}/>
                                    <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                                        <span className="block text-gray-500">{u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason?.substring(0,30) + '...' : u.deActiveReason}</span>
                                    </Popup>                                
                                </td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={u['firstConnect']}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3"><DateView date={u['lastConnect']}/></td>
                                <td className="whitespace-nowrap border-b-2 py-1 px-3">
                                    <span onClick={() => showQRCode(i.protocol, u)} className="cursor-pointer text-blue-700">QR Code</span>
                                    {' | '}
                                    <Copy data={() => serverRequest(context.server, '/client_config?protocol=' + i.protocol, u).then(data => data.config)}>Copy Config</Copy>
                                    {' | '}
                                    <span onClick={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.protocol, u, u.deActiveDate ? true : false))} className="cursor-pointer text-blue-700">{u.deActiveDate?'Active':'De-Active'}</span>
                                    {' | '}
                                    <span onClick={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, u))} className="cursor-pointer text-blue-700">{'Remove'}</span>
                                </td>
                            </tr>
                        })}
                    </Fragment>
                })}
            </tbody> */}
        </table>
    </Container>
    
}