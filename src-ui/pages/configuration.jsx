// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext } from 'react';
import { useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { DateView } from "../components/date-view";
import { useDialog } from "../components/dialog";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { PopupMenu } from "../components/popup-menu";
import { usePrompt } from "../hooks";
import { styles } from "../styles";
import { serverRequest } from "../util";

export default function ConfigurationPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    let [view, setView] = useState({
        showDetail: true
    });
    
    /** @type {import("swr").SWRResponse<V2RayConfig>} */
    let {mutate: refreshConfig, data: originalConfig, isValidating: isLoading} = useSWR('/config', serverRequest.bind(this, context.server));

    let [config, setConfig] = useState(originalConfig);
    
    useEffect(() => setConfig(originalConfig), [originalConfig]);

    let diffs = useMemo(() => {

    }, [config, originalConfig]);

    let NA = <span className="text-gray-400 text-xs">-</span>;

    let inboundDialog = useDialog((/** */ inbound) => {
        return <div className="bg-white rounded-md p-2">
            Hello
        </div>
    });

    let Inbounds = <div id="config-inbounds" className="rounded-lg border-[1px] flex flex-col flex-1">
        <FieldsGroup title={"Inbounds"} className="text-xs" data={view} dataSetter={setView} horizontal>
            <Field label="Show Detail" htmlFor="showDetail">
                <input type="checkbox" id="showDetail" />
            </Field>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <table className="w-full text-xs">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(styles.tableHead)}>#</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Tag</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Protocol</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Listen</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Port</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Settings</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Stream Settings</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Action</th>
                </tr>
            </thead>
            <tbody>
                {config?.inbounds?.map((x, index) => {
                    return <tr className="bg-white odd:bg-slate-50" key={index}>
                        <td className={classNames(styles.td)}>{index}</td>
                        <td className={classNames(styles.td)}>{x.tag ?? NA}</td>
                        <td className={classNames(styles.td)}>{x.protocol ?? NA}</td>
                        <td className={classNames(styles.td)}>{x.listen ?? NA}</td>
                        <td className={classNames(styles.td)}>{x.port ?? NA}</td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={'Clients'}>{x.settings?.clients?.length ?? NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={'Network'}>{x.streamSettings?.network ?? NA}</Info>
                                <Info label={'Security'}>{x.streamSettings?.security ?? NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <PopupMenu>
                                <PopupMenu.Item action={() => inboundDialog.show(x)}>Edit</PopupMenu.Item>
                                <PopupMenu.Item action={() => router.push('/users?protocol=' + x.protocol + (showAll?'&all=1':''))}>Users</PopupMenu.Item>
                                <PopupMenu.Item>Delete</PopupMenu.Item>
                            </PopupMenu>
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;

    let Outbounds = <div id="config-outbounds" className="rounded-lg border-[1px] flex flex-col flex-1">
        <FieldsGroup title={"Outbounds"} className="text-xs" data={view} dataSetter={setView} horizontal>
            <Field label="Show Detail" htmlFor="showDetail">
                <input type="checkbox" id="showDetail" />
            </Field>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <table className="w-full text-xs">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(styles.tableHead)}>#</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Tag</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Protocol</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Send Through</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Proxy Settings</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Stream Settings</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Action</th>
                </tr>
            </thead>
            <tbody>
                {config?.outbounds?.map((x, index) => {
                    return <tr className="bg-white odd:bg-slate-50" key={index}>
                        <td className={classNames(styles.td)}>{index}</td>
                        <td className={classNames(styles.td)}>{x.tag ?? NA}</td>
                        <td className={classNames(styles.td)}>{x.protocol}</td>
                        <td className={classNames(styles.td)}>{x.sendThrough ?? NA}</td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={'Tag'}>{x.proxySettings?.tag ?? NA}</Info>
                                <Info label={'Transport Layer'}>{x.proxySettings?.transportLayer ?? NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={'Security'}>{x.streamSettings?.security ?? NA}</Info>
                                <Info label={'Transport'}>{x.streamSettings?.transport ?? NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <PopupMenu>
                                <PopupMenu.Item>Delete</PopupMenu.Item>
                            </PopupMenu>
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;

    let Routing = <div id="config-outbounds" className="rounded-lg border-[1px] flex flex-col flex-1">
        <FieldsGroup title={"Routing"} className="text-xs" horizontal>
            <Field label="Domain Strategy" htmlFor="domainStrategy" data={config?.routing?.domainStrategy} dataSetter={domainStrategy => setConfig({ ...config, routing: { ...config?.routing, domainStrategy } })}>
                <select className={styles.input} id="domainStrategy">
                    <option value="">-</option>
                    <option value="AsIs">AsIs</option>
                    <option value="IPIfNonMatch">IPIfNonMatch</option>
                    <option value="IPOnDemand">IPOnDemand</option>
                </select>
            </Field>
            <Field label="Domain Matcher" htmlFor="domainMatcher" data={config?.routing?.domainMatcher} dataSetter={domainMatcher => setConfig({ ...config, routing: { ...config?.routing, domainMatcher } })}>
                <select className={styles.input} id="domainMatcher">
                    <option value="">-</option>
                    <option value="linear">Linear</option>
                    <option value="mph">MPH</option>
                </select>
            </Field>
        </FieldsGroup>
        {isLoading ? <div className="absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
            Loading ...
        </div> : null }
        <table className="w-full text-xs">
            <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
                <tr className="bg-white">
                    <th className={classNames(styles.tableHead)}>#</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Options</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Tags</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Filters</th>
                    <th className={classNames(styles.tableHead, 'cursor-pointer')}>Action</th>
                </tr>
            </thead>
            <tbody>
                {config?.routing?.rules?.map((x, index) => {
                    return <tr className="bg-white odd:bg-slate-50" key={index}>
                        <td className={classNames(styles.td)}>{index}</td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={"Type"}>{x.type ?? NA}</Info>
                                <Info label={"Domain Matcher"}>{x.domainMatcher ?? NA}</Info>
                                <Info label={"Network"}>{x.network ?? NA}</Info>
                                <Info label={"Source Port"}>{x.sourcePort ?? NA}</Info>
                                <Info label={"Attributes"}>{x.attrs ?? NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={"Inbound"}>{x.inboundTag ?? NA}</Info>
                                <Info label={"Outbound"}>{x.outboundTag ?? NA}</Info>
                                <Info label={"Balancer"}>{x.balancerTag ?? NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <Infos>
                                <Info label={"IPs"}>{x.ip ? Array.isArray(x.ip) && x.ip?.length > 1 ? `${x.ip.length} IPs` : x.ip : NA}</Info>
                                <Info label={"Domains"}>{x.domains ? Array.isArray(x.domains) && x.domains?.length > 1 ? `${x.domains.length} domains` : x.domains : NA}</Info>
                                <Info label={"Users"}>{x.user ? Array.isArray(x.user) && x.user?.length > 1 ? `${x.user.length} users` : x.user : NA}</Info>
                            </Infos>
                        </td>
                        <td className={classNames(styles.td)}>
                            <PopupMenu>
                                <PopupMenu.Item action={() => inboundDialog.show()}>Edit</PopupMenu.Item>
                                <PopupMenu.Item>Delete</PopupMenu.Item>
                            </PopupMenu>
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;

    return <Container>
        <Head>
            <title>Configuration</title>
        </Head>
        <div className="grid grid-cols-1 p-3 xl:grid-cols-2 gap-3">
            {Outbounds}
            {Inbounds}
            {Routing}
        </div>
    </Container>
}