import { Dialog } from "@common/components/dialog";
import { Field, FieldsGroup } from "@common/components/fields";
import { Info, Infos } from "@common/components/info";
import { useStoredState } from "@common/lib/hooks";
import { useCallback, useContext, useState } from "react";
import { toast } from "react-hot-toast";
import { styles } from "../../lib/styles";
import { serverRequest } from "../../lib/util";
import { AppContext } from "../app-context";
import { FieldServerNodes } from "../field-server-nodes";

interface DownloadRequest {
    id: number
    path: string
    downloaded: number 
    total: number
    status: string
    avgSpeed: number
    minSpeed: number, maxSpeed: number, speed: number, nDownloaded: number, tStart: number, tEnd: number, tConnect: number
    statusCode?: number
}

export function NodeSpeedTestDialog({ onClose, node }: { node: ServerNode, onClose?: Function }) {

    const [form, setForm] = useStoredState('speed-test', {
        path: '',
        type: 'path',
        serverNode: ''
    });

    const [download, setDownload] = useState<Partial<DownloadRequest>>({});
    const [updateTimer, setUpdateTimer] = useState<NodeJS.Timer>();
    const {server} = useContext(AppContext);

    const updateStatus = useCallback(async (downloadId) => {
        try {
            let result = await serverRequest({ ...server, node: node.id }, '/monitor/download-test?id=' + downloadId);
            setDownload(result);
            if (result.status != 'Complete' && !String(result.status).startsWith('Error')) {
                setTimeout(() => updateStatus(downloadId), 2000);
            }
        } catch (err) {
            toast.error(err?.message);
            console.error(err);
        }
    }, [setDownload]);

    const startDownload = useCallback(async () => {
        try {
            let result = await serverRequest({ ...server, node: node.id }, '/monitor/download-test', {
                nodeId: form.type == 'node' ? form.serverNode : undefined,
                path: form.type == 'path' ? form.path : undefined
            });

            if (result.id) {
                setDownload(result);
                updateStatus(result.id);
            }
            else {
                toast.error('Cannot start download');
            }
            console.log(result);
        } catch (err) {
            toast.error(err?.message);
            console.error(err)
        }
    }, [node, server, form, toast, updateStatus, download, setUpdateTimer]);

    return <Dialog title={"Speed Test - " + node.name} onClose={onClose} className="text-sm">
        <FieldsGroup data={form} dataSetter={setForm}>
            <div className="flex">
                <Field label="Type" htmlFor="type">
                    <select id="type" className={styles.input}>
                        <option value="path">Path</option>
                        <option value="node">Server Node</option>
                    </select>
                </Field>
                {form.type=='path' ?
                    <Field label="Path" htmlFor="path" className="flex-1">
                        <input type={'text'} id="path" placeholder="http://" className={styles.input}/>
                    </Field> :
                    <FieldServerNodes className="flex-1"/>
                }
                <div className="flex justify-center items-end">
                    <button onClick={() => startDownload()} className={styles.buttonItem}>Download</button>
                </div>
            </div>
        </FieldsGroup>
        <div className="p-2">
            <Infos>
                <Info label={'Request ID'}>{download.id ?? '-'}</Info>
                <Info label={'Status'}>{download.status ?? '-'}</Info>
                <Info label={'Status Code'}>{download.statusCode ?? '-'}</Info>
                <Info label={'Average Speed'}>{download.avgSpeed ?? '-'}</Info>
                <Info label={'Min Speed'}>{download.minSpeed ?? '-'}</Info>
                <Info label={'Max Speed'}>{download.maxSpeed ?? '-'}</Info>
            </Infos>
        </div>
    </Dialog>
}