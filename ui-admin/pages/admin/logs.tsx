import classNames from "classnames";
import Head from "next/head";
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { styles } from "../lib/styles";
import { Field } from "../components/fields";

export default function LogPage() {

    let {server} = useContext(AppContext);
    let router = useRouter();
    let [logs, setLogs] = useState(['']);
    let [isConnected, setConnected] = useState(false);
    let [filter, setFilter] = useState(String(router.query.filter ?? ''));

    let socket = useMemo(() => {
        return io(server?.url + '/logs');
    }, [server]);

    useEffect(() => {
        socket?.on('connect', () => setConnected(true));
        socket?.on('disconnect', () => setConnected(false));
        socket?.on('log', (log) => setLogs([...logs, log]));
    }, [logs, setLogs, socket, setConnected]);

    let emitFilter = useCallback(() => {
        socket?.emit('filter', filter);
    }, [socket, filter]);

    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        }
    }, []);

    let headClass = 'px-1 py-2 border-b-2 border-b-blue-900';

    return <Container>
        <Head>
            <title>Logs ({isConnected ? 'Connected' : 'Disconnected'})</title>
        </Head>
        <div className="flex flex-row px-3 py-3 border-t-[1px]">
            <Field label="Filter" htmlFor="filter" data={filter} dataSetter={value => setFilter(value)} horizontal>
                <input type={"text"} id="filter" className={styles.input} placeholder={'Username'}/>
            </Field>
            <div className="flex flex-row">
                <button className={styles.buttonItem} onClick={() => emitFilter()}>
                    Set Filter
                </button>
                <button className={styles.buttonItem} onClick={() => setLogs([])}>
                    Clear Logs
                </button>
            </div>
        </div>
        <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-md z-50">
                <tr>
                    <th className={headClass}>Log</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th colSpan={2} className={classNames('py-1', { 'bg-green-300': isConnected, 'bg-red-300': !isConnected })}>{isConnected ? 'Connected' : 'Disconnected'}</th>
                </tr>
                {logs.map((log, index) => {
                    return <tr key={index}>
                        <td>{log}</td>
                    </tr>;
                })}
            </tbody>
        </table>
    </Container>;    
}