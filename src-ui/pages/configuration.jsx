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
import { Dialog, useDialog } from "../components/dialog";
import { InboundEditor } from "../components/editor/inbound-editor";
import { OutboundEditor } from "../components/editor/outbound-editor";
import { RoutingBalancerEditor } from "../components/editor/routing-balancer-editor";
import { RoutingRuleEditor } from "../components/editor/routing-rule-editor";
import { Collection, Field, FieldsGroup, ObjectCollection } from "../components/fields";
import { Info, Infos } from "../components/info";
import { JsonView } from "../components/json";
import { PopupMenu } from "../components/popup-menu";
import { Table } from "../components/table";
import { Tabs } from "../components/tabs";
import { styles } from "../lib/styles";
import { deepCopy, getChanges, serverRequest, withoutKey } from "../lib/util";
import { Editable } from "../components/editable";

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

    let routingBalancerDialog = useDialog((
        /** @type {V2RayConfigRoutingBalancer} */
        balancer,
        /** @type {Function} */
        onEdit,
        /** @type {Function?} */
        onClose = null
    ) => <RoutingBalancerEditor balancer={balancer} dissmis={onClose} onEdit={onEdit}/>);

    let Inbounds = <div id="config-inbounds" className="rounded-lg border-2 flex flex-col flex-1">
        <Collection data={config?.inbounds ?? []} dataSetter={inbounds => setConfig({ ...config, inbounds })}>{inbounds => <>
            <FieldsGroup title={"Inbounds"} data={view} dataSetter={setView} horizontal>
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
        <FieldsGroup title="Log" data={config?.log ?? {}} dataSetter={log => setConfig({ ...config, log })} layoutVertical>
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

    let Api = <div className="rounded-lg flex flex-col flex-1 border-2">
    <FieldsGroup title="Api" data={config?.api ?? {}} dataSetter={api => setConfig({ ...config, api })} layoutVertical>
        <div className="p-2">
            <Field label="Tag" htmlFor="tag" className="flex-1 mt-1">
                <input type="text" className={styles.input} />
            </Field>
        </div>
        <Collection data={config?.api?.services ?? []} dataSetter={services => setConfig({ ...config, api: { ...config?.api, services } })}>{services =>
        <>
            <div className="flex flex-row items-center px-2">
                <label className={classNames(styles.label, "flex-1")}>Services</label>
                <div className="items-center">
                    <button type={"button"} onClick={() => services.addItem(null, 'HandlerService')} className={styles.addButtonSmall}>+ Add Service</button>
                </div>
            </div>
            <Table
                rows={services.items ?? []}
                columns={[ 'Service', 'Action' ]}
                cells={row => [
                    // Address
                    <Field htmlFor="service"><input type="text" id="service" className={styles.input} placeholder={""}/></Field>,
                    // Actions
                    <span className={styles.link} onClick={() => services.deleteItem(row)} >Delete</span>
                ]}
                rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={service => services.updateItem(row, service)}>{children}</FieldsGroup>}
            />                         
        </>
        }</Collection>
    </FieldsGroup>
    </div>

    let Policy = <div className="rounded-lg flex flex-col flex-1 border-2">
         <FieldsGroup title="System" data={config?.policy?.system ?? {}} dataSetter={system => setConfig({ ...config, policy: { ...config?.policy, system } })}>
            <div className="p-2 flex-row flex">
                <Field horizontal label="Stats Inbound Uplink" htmlFor="statsInboundUplink" className="flex-1 mt-1">
                    <input type="checkbox" id="statsInboundUplink" className={styles.input} />
                </Field>
                <Field horizontal label="Stats Inbound Downlink" htmlFor="statsInboundDownlink" className="flex-1 mt-1">
                    <input type="checkbox" id="statsInboundDownlink" className={styles.input} />
                </Field>
            </div>
        </FieldsGroup>
        <ObjectCollection data={config?.policy?.levels ?? {}} dataSetter={levels => setConfig({ ...config, policy: { ...config?.policy, levels } })}>{levels => 
            <>
                <div className="flex flex-row items-center px-2">
                    <label className={classNames(styles.label, "flex-1", "font-bold text")}>Levels</label>
                    <div className="items-center">
                        <button type={"button"} onClick={() => levels.setKey(Math.round(Math.random() * 10000).toString(), {})} className={styles.addButtonSmall}>+ Add Policy</button>
                    </div>
                </div>
                <Table
                    rows={Object.keys(levels.value ?? {}).map(key => ({ key, ...(levels.value ?? {})[key] }))}
                    columns={[ 'Level', 'Policy', 'Action' ]}
                    cells={row => [
                        <Editable value={row.key} onEdit={newKey => {
                            levels.renameKey(row.key, newKey);
                        }}>
                            {row.key}
                        </Editable>,
                        <div>
                            <Field htmlFor="handshake" label="Handshake"><input type="number" id="handshake" className={styles.input} placeholder={"4"}/></Field>
                            <Field htmlFor="connIdle" label="Connection Idle"><input type="number" id="connIdle" className={styles.input} placeholder={"300"}/></Field>
                            <Field htmlFor="uplinkOnly" label="Uplink Only"><input type="number" id="uplinkOnly" className={styles.input} placeholder={"300"}/></Field>
                            <Field htmlFor="downlinkOnly" label="Downlink Only"><input type="number" id="downlinkOnly" className={styles.input} placeholder={"300"}/></Field>
                            <Field htmlFor="bufferSize" label="Buffer Size"><input type="number" id="bufferSize" className={styles.input} placeholder={"300"}/></Field>
                            <Field htmlFor="statsUserUplink" label="Stats User Uplink" horizontal><input type="checkbox" id="statsUserUplink" className={styles.input} /></Field>
                            <Field htmlFor="statsUserDownlink" label="Stats User Downlink" horizontal><input type="checkbox" id="statsUserDownlink" className={styles.input}/></Field>
                        </div>,
                        // Actions
                        <span className={styles.link} onClick={() => levels.deleteKey(row.key)}>Delete</span>
                    ]}
                    rowContainer={(row, children) => <FieldsGroup data={withoutKey(row, 'key')} dataSetter={level => levels.setKey(row.key, level)}>{children}</FieldsGroup>}
                />
            </>
        }</ObjectCollection>
    </div>

    let Outbounds = <Collection
        data={config?.outbounds ?? []}
        dataSetter={outbounds => setConfig({ ...config, outbounds })}
    >{outbounds => <div id="config-outbounds" className="rounded-lg border-2 flex flex-col flex-1">
        <FieldsGroup title={"Outbounds"} data={view} dataSetter={setView} horizontal>
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

    let RoutingRules = <Collection data={config?.routing?.rules ?? []} dataSetter={rules => setConfig({ ...config, routing: { ...config?.routing, rules } })}>{rules => 
        <div id="config-routing" className="rounded-lg border-2 flex flex-col flex-1">
            <FieldsGroup title={"Rules"} horizontal data={config?.routing} dataSetter={routing => setConfig({ ...config, routing })}>
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
                rowContainer={(row, children) => {
                    return <>
                        {row.description ? <tr>
                            <td></td>
                            <td colSpan={4} className={"px-3 py-2"}>{row.description}</td>
                        </tr> : null }
                        {children}
                    </>
                }}
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
                        <Info label={"Port"}>{rule.port ?? NA}</Info>
                        <Info label={"IPs"}>{rule.ip ? Array.isArray(rule.ip) && rule.ip?.length > 1 ? `${rule.ip.length} IPs` : rule.ip : NA}</Info>
                        <Info label={"Domains"}>{rule.domain ? Array.isArray(rule.domain) && rule.domain?.length > 1 ? `${rule.domain.length} domains` : rule.domain : NA}</Info>
                        <Info label={"Users"}>{rule.user ? Array.isArray(rule.user) && rule.user?.length > 1 ? `${rule.user.length} users` : rule.user : NA}</Info>
                    </Infos>,
                    <PopupMenu>
                        <PopupMenu.Item action={() => routingRuleDialog.show(rule, rules.updateItem)}>Edit</PopupMenu.Item>
                        <PopupMenu.Item action={() => rules.deleteItem(rule)}>Delete</PopupMenu.Item>
                    </PopupMenu>
                ]}
                />
            
        </div>}
    </Collection>;

    let RoutingBalancers = <Collection data={config?.routing?.balancers ?? []} dataSetter={balancers => setConfig({ ...config, routing: { ...config?.routing, balancers } })}>{balancers => 
        <div id="config-routing" className="rounded-lg border-2 flex flex-col flex-1">
            <FieldsGroup title={"Balancers"} horizontal data={config?.routing} dataSetter={routing => setConfig({ ...config, routing })}>
                <div className="flex flex-row flex-1 pr-2">
                    <div className="flex-1 flex-row flex">
                        {/* Fields */}
                    </div>
                    <button onClick={() => routingBalancerDialog.show({}, balancers.addItem)} className={classNames(styles.addButton, "float-right")}>+ Add Balancer</button>
                </div>
            </FieldsGroup>
            <Table
                rows={balancers.items}
                columns={['Tag', 'Selectors', 'Action']}
                cells={balancer => [
                    balancer.tag,
                    balancer.selector?.join(', '),
                    <PopupMenu>
                        <PopupMenu.Item action={() => routingBalancerDialog.show(balancer, balancers.updateItem)}>Edit</PopupMenu.Item>
                        <PopupMenu.Item action={() => balancers.deleteItem(balancer)}>Delete</PopupMenu.Item>
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
            <button type={"button"} onClick={() => saveConfig()} className={styles.buttonPrimary}>Save Configuration</button>
        </FieldsGroup>
        <div className="p-3">
            <Tabs>
                <Tabs.Tab title="Log & Api" className="space-y-2">
                    {Log}
                    {Api}
                    <div className="rounded-lg flex flex-col flex-1 border-2">
                        <FieldsGroup title="Stats" layoutVertical>
                            <div className="p-2">
                                <Field label="Enable Stats" htmlFor="stats" data={!!config?.stats} dataSetter={value => setConfig(!value ? withoutKey(config ?? {}, 'stats') : { ...config, stats: {} })} className="flex-1 mt-1">
                                    <input type="checkbox" className={styles.input}/>
                                </Field>
                            </div>
                        </FieldsGroup>
                    </div>
                </Tabs.Tab>
                <Tabs.Tab title="Policy">
                    {Policy}
                </Tabs.Tab>
                <Tabs.Tab title="Inbounds">{Inbounds}</Tabs.Tab>
                <Tabs.Tab title="Outbounds">{Outbounds}</Tabs.Tab>
                <Tabs.Tab title="Routing">
                    <Tabs>
                        <Tabs.Tab title="Rules">{RoutingRules}</Tabs.Tab>
                        <Tabs.Tab title="Balancer">{RoutingBalancers}</Tabs.Tab>
                    </Tabs>
                </Tabs.Tab>
                <Tabs.Tab title="Changes">
                    <JsonView value={getChanges(originalConfig, config)}/>
                </Tabs.Tab>
            </Tabs>
        </div>
    </Container>
}