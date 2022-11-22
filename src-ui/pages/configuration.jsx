// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { useDialog } from "../components/dialog";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { PopupMenu } from "../components/popup-menu";
import { useArrayDelete, useArrayInsert, useArrayUpdate } from "../hooks";
import { styles } from "../styles";
import { serverRequest } from "../util";

/**
 * 
 * @param {{ inbound: V2RayConfigInbound, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
function InboundEditor({ inbound: inboundProp, dissmis, onEdit }) {
    let [inbound, setInbound] = useState(inboundProp);
    let ok = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(inboundProp, inbound);
        dissmis();
    }, [onEdit, inbound, dissmis]);
    return <div className="bg-white rounded-xl p-2 min-w-[20rem] flex flex-col">
        <form onSubmit={ok}>
        <div className="flex flex-row px-1 pb-2">
            <span className="flex-1 font-bold">Inbound</span>
            <div>
                <span onClick={dissmis} className="aspect-square bg-slate-200 rounded-full px-2 py-1 text-gray-600 cursor-pointer hover:bg-slate-900 hover:text-white">X</span>
            </div>
        </div>
        <div>
            <FieldsGroup data={inbound} dataSetter={setInbound}>
            <div className="flex flex-row">
                <Field htmlFor="tag" label="Tag">
                    <input type="text" id="tag" className={styles.input}/>
                </Field>
                <Field label="Protocol" className="flex-1" htmlFor="protocol">
                    <select id="protocol" className={styles.input}>
                        <option value="http">HTTP</option>
                        <option value="vmess">VMess</option>
                        <option value="vless">VLess</option>
                        <option value="blackhole">Blackhole</option>
                        <option value="dns">DNS</option>
                        <option value="freedom">Freedom</option>
                        <option value="mtproto">MTProto</option>
                        <option value="socks">SOCKS</option>
                        <option value="shadowsocks">Shadowsocks</option>
                    </select>
                </Field>
            </div>
            <div className="flex flex-row pt-2">
                <Field label="Listen" htmlFor="listen" className="flex-1">
                    <input type="text" id="listen" className={styles.input} placeholder={"0.0.0.0"}/>
                </Field>
                <Field label="Port" htmlFor="port">
                    <input type={"number"} id="port" className={styles.input}/>
                </Field>
            </div>
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Stream settings</h3>
                <div className="flex flex-row">
                    <Field label="Network" htmlFor="network" className="flex-1" data={inbound?.streamSettings ?? {}} dataSetter={streamSettings => setInbound({ ...inbound, streamSettings })}>
                        <select className={styles.input} id="network">
                            <option value="tcp">TCP</option>
                            <option value="kcp">KCP</option>
                            <option value="http">HTTP</option>
                            <option value="domainsocket">DomainSocket</option>
                            <option value="quic">Quic</option>
                            <option value="ws">WebSocket</option>
                        </select>
                    </Field>
                    <Field label="Security" htmlFor="security" data={inbound?.streamSettings ?? {}} dataSetter={streamSettings => setInbound({ ...inbound, streamSettings })}>
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field>
                </div>
            </div>
            </FieldsGroup>
            <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
                <button onClick={ok} className={styles.button}>Edit Inbound</button>
            </div>
        </div>
        </form>
    </div>
}

/**
 * 
 * @param {{ outbound: V2RayConfigOutbound, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
 function OutboundEditor({ outbound: outboundProp, dissmis, onEdit }) {
    let [outbound, setOutbound] = useState(outboundProp);
    let ok = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(outboundProp, outbound);
        dissmis();
    }, [onEdit, outbound, dissmis]);
    return <div className="bg-white rounded-xl p-2 min-w-[20rem] flex flex-col">
        <form onSubmit={ok}>
        <div className="flex flex-row px-1 pb-2">
            <span className="flex-1 font-bold">Outbound</span>
            <div>
                <span onClick={dissmis} className="aspect-square bg-slate-200 rounded-full px-2 py-1 text-gray-600 cursor-pointer hover:bg-slate-900 hover:text-white">X</span>
            </div>
        </div>
        <div>
            <FieldsGroup data={outbound} dataSetter={setOutbound}>
            <div className="flex flex-row">
                <Field htmlFor="tag" label="Tag">
                    <input type="text" id="tag" className={styles.input}/>
                </Field>
                <Field label="Protocol" className="flex-1" htmlFor="protocol">
                    <select id="protocol" className={styles.input}>
                        <option value="http">HTTP</option>
                        <option value="vmess">VMess</option>
                        <option value="vless">VLess</option>
                        <option value="blackhole">Blackhole</option>
                        <option value="dns">DNS</option>
                        <option value="freedom">Freedom</option>
                        <option value="mtproto">MTProto</option>
                        <option value="socks">SOCKS</option>
                        <option value="shadowsocks">Shadowsocks</option>
                    </select>
                </Field>
            </div>
            <div className="flex flex-row pt-2">
                <Field label="Send Through" htmlFor="sendThrough" className="flex-1">
                    <input type="text" id="sendThrough" className={styles.input} placeholder={"127.0.0.1"}/>
                </Field>
            </div>
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">
                    Stream settings
                    {!!outbound?.proxySettings?.tag ? <span className="italic text-gray-500 ml-2 text-xs px-2 py-1 rounded-lg bg-yellow-100">Ignored because of Proxy</span> : null }
                </h3>
                <div className="flex flex-row">
                    <Field label="Network" htmlFor="network" className="flex-1" data={outbound?.streamSettings ?? {}} dataSetter={streamSettings => setOutbound({ ...outbound, streamSettings })}>
                        <select className={styles.input} id="network">
                            <option value="tcp">TCP</option>
                            <option value="kcp">KCP</option>
                            <option value="http">HTTP</option>
                            <option value="domainsocket">DomainSocket</option>
                            <option value="quic">Quic</option>
                            <option value="ws">WebSocket</option>
                        </select>
                    </Field>
                    <Field label="Security" htmlFor="security" data={outbound?.streamSettings ?? {}} dataSetter={streamSettings => setOutbound({ ...outbound, streamSettings })}>
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field>
                </div>
            </div>
            <div className="flex flex-col">
                <h3 className="border-b-2 border-b-gray-200 px-2 pb-2 pt-2 font-smibold">Proxy settings</h3>
                <div className="flex flex-row">
                    <Field label="Proxy Tag" htmlFor="tag" className="flex-1" data={outbound?.proxySettings ?? {}} dataSetter={proxySettings => setOutbound({ ...outbound, proxySettings })}>
                        <input className={styles.input} type="text" id="tag" placeholder="Proxy Tag" />
                    </Field>
                    {/* <Field label="Security" htmlFor="security" data={outbound?.proxySettings ?? {}} dataSetter={proxySettings => setOutbound({ ...outbound, proxySettings })}>
                        <select className={styles.input} id="security">
                            <option value="none">None</option>
                            <option value="tls">TLS</option>
                        </select>
                    </Field> */}
                </div>
            </div>
            </FieldsGroup>
            <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
                <button onClick={ok} className={styles.button}>Edit Outbound</button>
            </div>
        </div>
        </form>
    </div>
}

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
    
    // Update config on server configuration changes
    useEffect(() => setConfig(originalConfig), [originalConfig]);

    // Not-Available value element
    let NA = <span className="text-gray-400 text-xs">-</span>;

    let inboundDialog = useDialog(
        /**
         * 
         * @param {V2RayConfigInbound} inbound 
         * @param {Function} onEdit 
         * @param {Function?} close 
         * @returns 
         */
        (inbound, onEdit, close = null) => <InboundEditor inbound={inbound} dissmis={close} onEdit={onEdit}/>);

    // Delete inbound
    let deleteInbound = useArrayDelete(config?.inbounds ?? [], inbounds => setConfig({ ...config, inbounds }));
    let insertInbound = useArrayInsert(config?.inbounds ?? [], inbounds => setConfig({ ...config, inbounds }));
    let editInbound = useArrayUpdate(config?.inbounds ?? [], inbounds => setConfig({ ...config, inbounds }));

    let outboundDialog = useDialog((
        /** @type {V2RayConfigOutbound} */
        outbound,
        /** @type {Function} */
        onEdit,
        /** @type {Function?} */
        onClose = null
    ) => <OutboundEditor outbound={outbound} onEdit={onEdit} dissmis={onClose}/>);

    // Delete inbound
    let deleteOutbound = useArrayDelete(config?.outbounds ?? [], outbounds => setConfig({ ...config, outbounds }));
    let insertOutbound = useArrayInsert(config?.outbounds ?? [], outbounds => setConfig({ ...config, outbounds }));
    let editOutbound = useArrayUpdate(config?.outbounds ?? [], outbounds => setConfig({ ...config, outbounds }));

    let Inbounds = <div id="config-inbounds" className="rounded-lg border-2 flex flex-col flex-1">
        <FieldsGroup title={"Inbounds"} className="text-xs" data={view} dataSetter={setView} horizontal>
            <div className="flex flex-row flex-1">
                <div className="flex-1">
                    <Field label="Show Detail" htmlFor="showDetail">
                        <input type="checkbox" id="showDetail" />
                    </Field>
                </div>
                <button onClick={() => inboundDialog.show({}, insertInbound)} className="rounded-lg mr-2 px-3 py-1 duration-150 hover:ring-2 ring-green-200 bg-slate-200 hover:bg-green-700 hover:text-white float-right">+ Add Inbound</button>
            </div>
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
                                <PopupMenu.Item action={() => inboundDialog.show(x, editInbound)}>Edit</PopupMenu.Item>
                                <PopupMenu.Item action={() => router.push('/users?protocol=' + x.protocol + (showAll?'&all=1':''))}>Users</PopupMenu.Item>
                                <PopupMenu.Item action={() => deleteInbound(x)}>Delete</PopupMenu.Item>
                            </PopupMenu>
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;

    let Log = <div className="rounded-lg flex flex-col flex-1 border-2">
        <FieldsGroup title="Log" className="text-xs" data={config?.log} dataSetter={log => setConfig({ ...config, log })} layoutVertical>
            <div className="p-2">
                <Field label="Level" htmlFor="level">
                    <select id="level" className={styles.input}>
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="none">None</option>
                    </select>
                </Field>
                <Field label="Access Log" htmlFor="access" className="flex-1 mt-1">
                    <input type="text" className={styles.input} placeholder="/var/log/v2ray/access.log" />
                </Field>
                <Field label="Error Log" htmlFor="error" className="flex-1 mt-1">
                    <input type="text" className={styles.input} placeholder="/var/log/v2ray/error.log" />
                </Field>
            </div>
        </FieldsGroup>
    </div>

    let Outbounds = <div id="config-outbounds" className="rounded-lg border-2 flex flex-col flex-1">
        <FieldsGroup title={"Outbounds"} className="text-xs" data={view} dataSetter={setView} horizontal>
            <div className="flex flex-row flex-1">
                <div className="flex-1">
                    <Field label="Show Detail" htmlFor="showDetail">
                        <input type="checkbox" id="showDetail" />
                    </Field>
                </div>
                <button onClick={() => outboundDialog.show({}, insertOutbound)} className="rounded-lg mr-2 px-3 py-1 duration-150 hover:ring-2 ring-green-200 bg-slate-200 hover:bg-green-700 hover:text-white float-right">+ Add Outbound</button>
            </div>
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
                                <PopupMenu.Item action={() => outboundDialog.show(x, editOutbound)}>Edit</PopupMenu.Item>
                                <PopupMenu.Item action={() => deleteOutbound(x)}>Delete</PopupMenu.Item>
                            </PopupMenu>
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;

    let Routing = <div id="config-outbounds" className="rounded-lg border-2 flex flex-col flex-1">
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
            {Log}
            {Inbounds}
            {Outbounds}
            {Routing}
        </div>
    </Container>
}