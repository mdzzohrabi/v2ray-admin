import { ArrowPathIcon, BoltIcon, CloudIcon, ComputerDesktopIcon, PencilIcon, PlusIcon, ServerIcon, TrashIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Head from "next/head";
import { FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from "react-hot-toast";
import { AppContext } from "../components/app-context";
import { Container } from "../components/container";
import { DateView } from "../components/date-view";
import { Dialog, useDialog } from "../components/dialog";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { PopupMenu } from "../components/popup-menu";
import { Table } from "../components/table";
import { useContextSWR, usePrompt } from "../lib/hooks";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";

interface ServerNodeDialogProps {
    onEdit: (node?: Partial<ServerNode>) => any
    onClose: Function
    node: Partial<ServerNode>
}

function ServerNodeDialog({ onEdit, onClose, node: nodeProp }: ServerNodeDialogProps) {

    let [serverNode, setServerNode] = useState(nodeProp ?? {});

    let onSubmit = useCallback((e: FormEvent) => {
        e?.preventDefault();
        onEdit(serverNode);
        onClose();
    }, [onEdit, serverNode]);

    return <Dialog title="Server Node" onClose={onClose} onSubmit={onSubmit}>
        <FieldsGroup data={serverNode} dataSetter={setServerNode}>
            <div className="flex flex-row">
                <Field className={'flex-1'} label="Name" htmlFor="name">
                    <input type="text" id="name" className={styles.input} placeholder={'Server 1'}/>
                </Field>
                <Field label="Type" htmlFor="type">
                    <select id="type" className={styles.input}>
                        <option value="client">Client</option>
                        <option value="server">Server</option>
                    </select>
                </Field>
            </div>
            <Field className={'flex-1'} label="Address" htmlFor="address">
                <input type="text" id="address" className={styles.input} placeholder={'0.0.0.0'}/>
            </Field>
            {serverNode?.type == 'server' ? <Field label="Api Key" htmlFor="apiKey">
                <input type="text" id="apiKey" className={styles.input} readOnly={serverNode?.type != 'server'}/>
            </Field> : null }
            {serverNode?.type == 'server' ? <div className="flex flex-row gap-3 py-2/">
                <Field label="Sync Database" htmlFor="sync" horizontal hint={'Sync database with the server'}>
                    <input type="checkbox" id="sync" className={styles.input}/>
                </Field>
                <Field label="Sync V2Ray Config" htmlFor="syncConfig" horizontal hint={'Copy V2Ray config from server only if its defined also in the server'}>
                    <input type="checkbox" id="syncConfig" className={styles.input}/>
                </Field>
            </div>
            : null }
            <Infos className={'p-2 leading-8'}>
                <Info label={'ID'}>{serverNode?.id ?? '-'}</Info>
                {serverNode?.type == 'client' ? <Info label={'Api Key'}>{serverNode?.apiKey ?? '-'}</Info> : null }
                <Info label={'Last Conencted IP'}>{serverNode?.lastConnectIP ?? '-'}</Info>
                <Info label={'Last Connect Date'}>{serverNode?.lastConnectDate ?? '-'}</Info>
                <Info label={'Last Sync Date'}>{serverNode?.lastSyncDate ?? '-'}</Info>
            </Infos>
            <div className="flex flex-row border-t-[1px] pt-2 mt-2">
                <Field htmlFor="disabled" label="Disabled" horizontal>
                    <input type={'checkbox'} id="disabled"/>
                </Field>
                <button type="button" onClick={e => onClose()} className={classNames(styles.button, 'ml-auto')}>Cancel</button>
                <button type="submit" className={styles.buttonPrimary}>Save Server Node</button>
            </div>
        </FieldsGroup>
    </Dialog>
}

export default function NodesPage() {

    let {server} = useContext(AppContext);
    let [isPinging, setIsPinging] = useState(false);
    
    let [nodes, setNodes] = useState<(ServerNode & { ping?: number | string })[]>([]);
    let {mutate: refreshNodes, data: nodesResponse, isValidating: isLoading} = useContextSWR<ServerNode[]>('/nodes?all=1');
    
    useEffect(() => setNodes(nodesResponse), [nodesResponse]);

    const pingNodes = useCallback(async () => {
        setIsPinging(true);
        let result = await serverRequest<ServerNode[]>(server, '/ping-nodes');
        setNodes(result);        
        setIsPinging(false);
    }, [server]);

    let addNode = useCallback(async (node: ServerNode) => {
        try {
            let result = await serverRequest(server, 'POST:/nodes', node);
            if (result?.ok) {
                toast.success(result?.message);
                refreshNodes();
            }
        } catch (e) {
            toast.error(e?.message);
        }
    }, [server]);

    let editNode = useCallback(async (node: ServerNode) => {
        try {
            let result = await serverRequest(server, 'PUT:/nodes', node);
            if (result?.ok) {
                toast.success(result?.message);
                refreshNodes();
            }
        } catch (e) {
            toast.error(e?.message);
        }
    }, [server]);

    let deleteNode = useCallback(async (node: ServerNode) => {
        try {
            let result = await serverRequest(server, 'DELETE:/nodes', node);
            if (result?.ok) {
                toast.success(result?.message);
                refreshNodes();
            }
        } catch (e) {
            toast.error(e?.message);
        }
    }, [server]);

    let serverNodeDialog = useDialog((node: ServerNode, onEdit: ((node: Partial<ServerNode>) => any), onClose: Function) => <ServerNodeDialog
        onClose={onClose}
        node={node}
        onEdit={onEdit}
    />)

    // Not-Available value element
    let NA = <span className="text-gray-400 text-xs">-</span>;

    let prompt = usePrompt();

    return <Container>
        <Head>
            <title>Server Nodes</title>
        </Head>
        <FieldsGroup title={<span className="flex items-center gap-x-2"><CloudIcon className="w-6"/> Server Nodes</span>} className="px-3">
            <div className="flex-1 flex-row flex items-center">
                {isLoading? <span className="rounded-lg bg-gray-700 text-white px-3 py-0">Loading</span> :null}
                {isPinging? <span className="rounded-lg bg-rose-200 text-rose-900 px-3 py-0">Pinging</span> :null}
            </div>
            <div className="flex flex-row">
                <button type={"button"} onClick={() => pingNodes()} className={classNames(styles.buttonItem)}>
                    <BoltIcon className="w-4"/>
                    Ping Servers
                </button>
                <button type={"button"} onClick={() => refreshNodes()} className={classNames(styles.buttonItem)}>
                    <ArrowPathIcon className="w-4"/>
                    Reload
                </button>
                <button onClick={e => serverNodeDialog.show({}, addNode)} className={classNames(styles.buttonItem)}>
                    <PlusIcon className="w-4"/>
                    Add Node
                </button>
            </div>
        </FieldsGroup>
        <div className="p-3">
            <div className="rounded-lg flex flex-col flex-1 border-2">
                <Table
                    rows={nodes ?? []}
                    columns={[ 'ID', 'Type', 'Name', 'Address', 'Api Key', 'Ping (ms)', 'Last Connect', 'Actions' ]}
                    cells={row => [
                        row.id,
                        <div className="flex flex-row space-x-2">
                            {row.type == 'server' ? <ServerIcon className="w-4"/> : <ComputerDesktopIcon className="w-4"/>}
                            <span>{row.type}</span>
                        </div>,
                        <div className="flex flex-row items-center space-x-2">
                            <span className={classNames("aspect-square w-2 h-2 inline-block rounded-full", {'bg-rose-500': row.disabled, 'bg-teal-700': !row.disabled })}></span>
                            <span>{row.name}</span>
                        </div>,
                        row.address ?? NA,
                        row.apiKey ?? NA,
                        typeof row.ping == 'number' ? row.ping + ' ms' : row.ping ?? NA,
                        <Infos>
                            <Info label={'IP'}>{row.lastConnectIP ?? '-'}</Info>
                            <Info label={'Date'}><DateView locale="en" date={row.lastConnectDate}/></Info>
                        </Infos>,
                        <PopupMenu>
                            <PopupMenu.Item icon={<PencilIcon className='w-4'/>} action={() => serverNodeDialog.show(row, editNode)}>
                                Edit Node
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<TrashIcon className="w-4"/>} action={() => prompt(`Delete selected node "${row.name}" ?`, 'Delete Node', () => deleteNode(row))}>
                                Delete
                            </PopupMenu.Item>
                        </PopupMenu>
                    ]}
                    
                />
            </div>
        </div>
    </Container>
}