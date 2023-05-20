import { DateView } from "@common/components/date-view";
import { Dialog } from "@common/components/dialog";
import { Field, FieldsGroup } from "@common/components/fields";
import { Info, Infos } from "@common/components/info";
import { Progress } from "@common/components/progress";
import { Size } from "@common/components/size";
import { Tabs } from "@common/components/tabs";
import { useStoredState } from "@common/lib/hooks";
import { dateDiff } from "@common/lib/util";
import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { styles } from "../../lib/styles";
import { serverRequest } from "../../lib/util";
import { AppContext } from "../app-context";
import { FieldServerNodes } from "../field-server-nodes";
import { Interval } from "../interval";

interface DownloadRequest {
    id: number
    path: string
    downloaded: number 
    total: number
    status: string
    avgSpeed: number
    minSpeed: number, maxSpeed: number, speed: number, tStart: number, tEnd: number, tConnect: number
    statusCode?: number
    headers?: any
}

export function NodeSpeedTestDialog({ onClose, node }: { node: ServerNode, onClose?: Function }) {

    const [form, setForm] = useStoredState('speed-test', {
        path: '',
        type: 'path',
        serverNode: '',
        size: 50
    });

    const [download, setDownload] = useState<Partial<DownloadRequest>>({});
    const [updateTimer, setUpdateTimer] = useState<NodeJS.Timer>();
    const {server} = useContext(AppContext);

    const updateStatus = useCallback(async (downloadId) => {
        try {
            let result = await serverRequest({ ...server, node: node.id }, '/monitor/download-test?id=' + downloadId);
            setDownload(result);
            if (result.status != 'Complete' && !String(result.status).startsWith('Error')) {
                setUpdateTimer(setTimeout(() => updateStatus(downloadId), 1000));
            }
        } catch (err) {
            toast.error(err?.message);
            console.error(err);
        }
    }, [setDownload]);

    const startDownload = useCallback(async () => {
        try {

            if (download?.id) {
                serverRequest({ ...server, node: node.id }, '/monitor/download-abort?id=' + download?.id).catch(console.error);
                clearInterval(updateTimer);
            }

            let result = await serverRequest({ ...server, node: node.id }, '/monitor/download-test', {
                nodeId: form.type == 'node' ? form.serverNode : undefined,
                path: form.type == 'path' ? form.path : undefined,
                size: form?.size
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
            console.error(err);
        }
    }, [node, server, form, toast, updateStatus, download, updateTimer]);

    useEffect(() => {

        return function destroy() {
            if (download?.id) {
                serverRequest({ ...server, node: node.id }, '/monitor/download-abort?id=' + download?.id).catch(console.error);
                clearInterval(updateTimer);
            }
        }

    }, [download, updateTimer]);

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
                    <>
                        <FieldServerNodes className="flex-1"/>
                        <Field htmlFor="size" label="Size (MB)">
                            <input type="number" placeholder="10 MB"  className={styles.input} id="size"/>
                        </Field>
                    </>
                }
                <div className="flex justify-center items-end">
                    <button onClick={() => startDownload()} className={styles.buttonItem}>Download</button>
                </div>
            </div>
        </FieldsGroup>
        <div className="p-2">
            <Progress total={download.total} className={'my-2'} title={<>
                Download Progress (<Size size={download.downloaded ?? 0}/>/<Size size={download.total ?? 0}/>)
            </>} renderValue={x => <Size size={x}/>} bars={[
                { title: 'Downloaded', value: download.downloaded }
            ]}/>
            <Tabs>
                <Tabs.Tab title="Infos">
                    <Infos className="grid md:grid-cols-2 gap-x-2 items-center ">
                        <Info label={'Request ID'}>{download.id ?? '-'}</Info>
                        <Info label={'Status'}>{download.status ?? '-'}</Info>
                        <Info label={'Status Code'}>{download.statusCode ?? '-'}</Info>
                        <Info label={'Average Speed'}><Size size={download.avgSpeed ?? 0}/></Info>
                        <Info label={'Min Speed'}><Size size={download.minSpeed ?? 0}/></Info>
                        <Info label={'Max Speed'}><Size size={download.maxSpeed ?? 0}/></Info>
                        <Info label={'Total Size'}><Size size={download.total ?? 0}/></Info>
                        <Info label={'Downloaded'}><Size size={download.downloaded ?? 0}/></Info>
                        <Info label={'Start Time'}><DateView date={download.tStart} full={true}/></Info>
                        <Info label={'Connect Time'}><DateView date={download.tConnect} full={true}/></Info>
                        <Info label={'End Time'}><DateView date={download.tEnd} full={true}/></Info>
                        <Info label={'Ellapsed'}>
                            <Interval interval={1000} children={() => <span style={{ direction: 'rtl' }}>{dateDiff(download.tConnect, download.tEnd ?? Date.now()).text}</span>}/>
                        </Info>
                    </Infos>
                </Tabs.Tab>
                <Tabs.Tab title="Headers">
                    <Infos>
                        {download.headers ? Object.keys(download.headers).map(x => {
                            return <Info label={x}>{download.headers[x]}</Info>
                        }) : null}
                    </Infos>
                </Tabs.Tab>
            </Tabs>
        </div>
    </Dialog>
}