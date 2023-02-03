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

export default function NodesPage() {

    let context = useContext(AppContext);
    let router = useRouter();

    let showAll = router.query.all == '1';
    let [view, setView] = useState({
        showDetail: true
    });

    let request = useMemo(() => {
        return serverRequest.bind(this, context.server);
    }, [context]);
    
    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {mutate: refreshNodes, data: nodes, isValidating: isLoading} = useSWR('/nodes', request, {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false
    });

    // Not-Available value element
    let NA = <span className="text-gray-400 text-xs">-</span>;

    return <Container>
        <Head>
            <title>Server Nodes</title>
        </Head>
        <FieldsGroup title="Nodes" className="px-3">
            <div className="flex-1 flex-row flex items-center">
                {isLoading? <span className="rounded-lg bg-gray-700 text-white px-3 py-0">Loading</span> :null}
            </div>
        </FieldsGroup>
        <div className="p-3">
            <Tabs>
                <Tabs.Tab title="Nodes" className="space-y-2">
                    <div className="rounded-lg flex flex-col flex-1 border-2">
                        <Table
                            rows={nodes ?? []}
                            columns={[ 'ID', 'Name', 'Api Key', 'Last Connect' ]}
                            cells={row => [
                                row.id,
                                row.name,
                                row.apiKey,
                                row.lastConnect
                            ]}
                        />
                    </div>
                </Tabs.Tab>
                <Tabs.Tab title="Current Node">

                </Tabs.Tab>
            </Tabs>
        </div>
    </Container>
}