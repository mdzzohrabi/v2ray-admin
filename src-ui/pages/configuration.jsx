// @ts-check
/// <reference types="../../types"/>
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from 'react';
import { useMemo } from "react";
import { useCallback } from "react";
import toast from "react-hot-toast";
import useSWR from 'swr';
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { useDialog } from "../components/dialog";
import { InboundEditor } from "../components/editor/inbound-editor";
import { OutboundEditor } from "../components/editor/outbound-editor";
import { RoutingRuleEditor } from "../components/editor/routing-rule-editor";
import { Collection, Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { PopupMenu } from "../components/popup-menu";
import { Table } from "../components/table";
import { styles } from "../styles";
import { deepCopy, getChanges, serverRequest } from "../util";

export default function ConfigurationPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';
    let [view, setView] = useState({
        showDetail: true
    });

    let request = useMemo(() => {
        return serverRequest.bind(this, context.server);
    }, [context]);
    
    /** @type {import("swr").SWRResponse<V2RayConfig>} */
    let {mutate: refreshConfig, data: originalConfig, isValidating: isLoading} = useSWR('/config', request, {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false
    });
    let [config, setConfig] = useState(deepCopy(originalConfig));

    // Update config on server configuration changes
    useEffect(() => setConfig(deepCopy(originalConfig)), [originalConfig]);

    const saveConfig = useCallback(async () => {
        try {
            let changes = getChanges(originalConfig, config);
            let result = await serverRequest(context.server, '/config', {
                changes
            });
            if (result?.ok) {
                toast.success(`Configuration saved successful`);
                refreshConfig();
            } else {
                throw Error(`Cannot save configuration`);
            }
        } catch (err) {
            toast.error(err?.message ?? 'Error');   
        }
    }, [context, config, originalConfig, refreshConfig]);

    const restartService = useCallback(async () => {
        try {
            let result = await serverRequest(context.server, '/restart', {});
            toast.success(result?.result || 'Service restarted');
        } catch (err) {
            toast.error(err?.message ?? 'Error');   
        }
    }, [context]);

    // Not-Available value element
    let NA = <span className="text-gray-400 text-xs">-</span>;

    let inboundDialog = useDialog(
        /**
         * @param {V2RayConfigInbound} inbound 
         * @param {Function} onEdit 
         * @param {Function?} close 
         * @returns 
         */
        (inbound, onEdit, close = null) => <InboundEditor inbound={inbound} dissmis={close} onEdit={onEdit}/>);

    let outboundDialog = useDialog((
        /** @type {V2RayConfigOutbound} */
        outbound,
        /** @type {Function} */
        onEdit,
        /** @type {Function?} */
        onClose = null
    ) => <OutboundEditor outbound={outbound} onEdit={onEdit} dissmis={onClose}/>);

    let routingRuleDialog = useDialog((
        /** @type {V2RayConfigRoutingRule} */
        rule,
        /** @type {Function} */
        onEdit,
        /** @type {Function?} */
        onClose = null
    ) => <RoutingRuleEditor rule={rule} onEdit={onEdit} dissmis={onClose}/>);

    let Inbounds = <div id="config-inbounds" className="rounded-lg border-2 flex flex-col flex-1">
        <Collection data={config?.inbounds ?? []} dataSetter={inbounds => setConfig({ ...config, inbounds })}>{inbounds => <>
            <FieldsGroup title={"Inbounds"} className="text-xs" data={view} dataSetter={setView} horizontal>
                <div className="flex flex-row flex-1 pr-2">
                    <div className="flex-1">
                        {/* <Field label="Show Detail" htmlFor="showDetail">
                            <input type="checkbox" id="showDetail" />
                        </Field> */}
                    </div>
                    <button onClick={() => inboundDialog.show({}, inbounds.addItem)} className={classNames(styles.addButton, "float-right")}>+ Add Inbound</button>
                </div>
            </FieldsGroup>
            <Table
                rows={config?.inbounds ?? []}
                columns={['Tag', 'Protocol', 'Listen', 'Port', 'Settings', 'Stream Settings', 'Action']}
                cells={row => [
                    row.tag ?? NA,
                    row.protocol ?? NA,
                    row.listen ?? NA,
                    row.port ?? NA,
                    // Settings
                    <Infos>
                        <Info label={'Clients'}>{row.settings?.clients?.length ?? NA}</Info>
                    </Infos>,
                    // Stream
                    <Infos>
                        <Info label={'Network'}>{row.streamSettings?.network ?? NA}</Info>
                        <Info label={'Security'}>{row.streamSettings?.security ?? NA}</Info>
                    </Infos>,
                    // Actions
                    <PopupMenu>
                        <PopupMenu.Item action={() => inboundDialog.show(row, inbounds.updateItem)}>Edit</PopupMenu.Item>
                        <PopupMenu.Item action={() => router.push('/users?protocol=' + row.protocol + (showAll?'&all=1':''))}>Users</PopupMenu.Item>
                        <PopupMenu.Item action={() => inbounds.deleteItem(row)}>Delete</PopupMenu.Item>
                    </PopupMenu>
                ]}
            />
        </>}
        </Collection>
    </div>;

    let Log = <div className="rounded-lg flex flex-col flex-1 border-2">
        <FieldsGroup title="Log" className="text-xs" data={config?.log ?? {}} dataSetter={log => setConfig({ ...config, log })} layoutVertical>
            <div className="p-2">
                <Field label="Level" htmlFor="loglevel">
                    <select id="loglevel" className={styles.input}>
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

    let Outbounds = <Collection
        data={config?.outbounds ?? []}
        dataSetter={outbounds => setConfig({ ...config, outbounds })}
    >{outbounds => <div id="config-outbounds" className="rounded-lg border-2 flex flex-col flex-1">
        <FieldsGroup title={"Outbounds"} className="text-xs" data={view} dataSetter={setView} horizontal>
            <div className="flex flex-row flex-1 pr-2">
                <div className="flex-1">
                    {/* <Field label="Show Detail" htmlFor="showDetail">
                        <input type="checkbox" id="showDetail" />
                    </Field> */}
                </div>
                <button onClick={() => outboundDialog.show({}, outbounds.addItem)} className={classNames(styles.addButton, "float-right")}>+ Add Outbound</button>
            </div>
        </FieldsGroup>
        <Table
            rows={outbounds.items}
            columns={['Tag', 'Protocol', 'Send Through', 'Proxy Settings', 'Stream Settings', 'Action']}
            cells={x => [
                x.tag ?? NA,
                <div className="flex flex-col">
                    <span>{x.protocol ?? NA}</span>
                    {x.settings?.servers && (x.settings?.servers?.length ?? 0) > 0 ? <span className="text-gray-400">{x.settings?.servers[0].address}:{x.settings?.servers[0].port}</span> : null}
                </div>,
                x.sendThrough ?? NA,
                <Infos>
                    <Info label={'Tag'}>{x.proxySettings?.tag ?? NA}</Info>
                    <Info label={'Transport Layer'}>{x.proxySettings?.transportLayer ?? NA}</Info>
                </Infos>,
                <Infos>
                    <Info label={'Security'}>{x.streamSettings?.security ?? NA}</Info>
                    <Info label={'Transport'}>{x.streamSettings?.transport ?? NA}</Info>
                </Infos>,
                <PopupMenu>
                    <PopupMenu.Item action={() => outboundDialog.show(x, outbounds.updateItem)}>Edit</PopupMenu.Item>
                    <PopupMenu.Item action={() => outbounds.deleteItem(x)}>Delete</PopupMenu.Item>
                </PopupMenu>
            ]}
        />
    </div>}
    </Collection>;

    let Routing = <Collection data={config?.routing?.rules ?? []} dataSetter={rules => setConfig({ ...config, routing: { ...config?.routing, rules } })}>{rules => 
        <div id="config-routing" className="rounded-lg border-2 flex flex-col flex-1">
            <FieldsGroup title={"Routing"} className="text-xs" horizontal data={config?.routing} dataSetter={routing => setConfig({ ...config, routing })}>
                <div className="flex flex-row flex-1 pr-2">
                    <div className="flex-1 flex-row flex">
                        <Field label="Domain Strategy" htmlFor="domainStrategy">
                            <select className={styles.input} id="domainStrategy">
                                <option value="">-</option>
                                <option value="AsIs">AsIs</option>
                                <option value="IPIfNonMatch">IPIfNonMatch</option>
                                <option value="IPOnDemand">IPOnDemand</option>
                            </select>
                        </Field>
                        <Field label="Domain Matcher" htmlFor="domainMatcher">
                            <select className={styles.input} id="domainMatcher">
                                <option value="">-</option>
                                <option value="linear">Linear</option>
                                <option value="mph">MPH</option>
                            </select>
                        </Field>
                    </div>
                    <button onClick={() => routingRuleDialog.show({}, rules.addItem)} className={classNames(styles.addButton, "float-right")}>+ Add Rule</button>
                </div>
            </FieldsGroup>
            <Table
                rows={rules.items}
                columns={['Options', 'Tags', 'Filters', 'Action']}
                cells={rule => [
                    <Infos>
                        <Info label={"Type"}>{rule.type ?? NA}</Info>
                        <Info label={"Domain Matcher"}>{rule.domainMatcher ?? NA}</Info>
                        <Info label={"Network"}>{rule.network ?? NA}</Info>
                        <Info label={"Source Port"}>{rule.sourcePort ?? NA}</Info>
                        <Info label={"Attributes"}>{rule.attrs ?? NA}</Info>
                    </Infos>,
                    <Infos>
                        <Info label={"Inbound"}>{rule.inboundTag ?? NA}</Info>
                        <Info label={"Outbound"}>{rule.outboundTag ?? NA}</Info>
                        <Info label={"Balancer"}>{rule.balancerTag ?? NA}</Info>
                    </Infos>,
                    <Infos>
                        <Info label={"IPs"}>{rule.ip ? Array.isArray(rule.ip) && rule.ip?.length > 1 ? `${rule.ip.length} IPs` : rule.ip : NA}</Info>
                        <Info label={"Domains"}>{rule.domains ? Array.isArray(rule.domains) && rule.domains?.length > 1 ? `${rule.domains.length} domains` : rule.domains : NA}</Info>
                        <Info label={"Users"}>{rule.user ? Array.isArray(rule.user) && rule.user?.length > 1 ? `${rule.user.length} users` : rule.user : NA}</Info>
                    </Infos>,
                    <PopupMenu>
                        <PopupMenu.Item action={() => routingRuleDialog.show(rule, rules.deleteItem)}>Edit</PopupMenu.Item>
                        <PopupMenu.Item action={() => rules.deleteItem(rule)}>Delete</PopupMenu.Item>
                    </PopupMenu>
                ]}
                />
            
        </div>}
    </Collection>;

    return <Container>
        <Head>
            <title>Configuration</title>
        </Head>
        <FieldsGroup title="Configuration" className="px-3">
            <div className="flex-1 flex-row flex items-center">
                {isLoading? <span className="rounded-lg bg-gray-700 text-white px-3 py-0">Loading</span> :null}
                {getChanges(originalConfig, config).length > 0 ? <span className="rounded-lg bg-yellow-100 text-yellow-800 text-xs px-3 py-1">Changed</span> :null}
            </div>
            <button type={"button"} onClick={() => restartService()} className={styles.button}>Restart V2Ray</button>
            <button type={"button"} onClick={() => saveConfig()} className={"border-2 border-green-600 bg-green-600 text-white whitespace-nowrap rounded-lg px-5 py-1 ml-2 duration-100 hover:ring-inset hover:ring-green-300 hover:ring-2"}>Save Configuration</button>
        </FieldsGroup>
        <div className="grid grid-cols-1 p-3 xl:grid-cols-2 gap-3">
            {Log}
            {Inbounds}
            {Outbounds}
            {Routing}
        </div>
    </Container>
}