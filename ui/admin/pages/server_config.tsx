import { Field, FieldsGroup } from "@common/components/fields";
import { Loading } from "@common/components/loading";
import { useAwareState, useStoredState } from "@common/lib/hooks";
import { BoltIcon, GlobeAsiaAustraliaIcon, ServerIcon, ServerStackIcon, TrashIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";
import { AppContext, ServerContext } from "../components/app-context";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";

export default function ServerConfig() {
    let context = useContext(AppContext);
    let router = useRouter();
    let [loading, setLoading] = useState(false);
    let [loadingMessage, setLoadingMessage] = useState('Loading ...');
    let [server, setServer] = useAwareState<ServerContext>({ mode: 'login', ...(context?.server ?? {}) }, [context]);
    let [login, setLogin] = useState({ password: '' });
    let [servers, setServers] = useStoredState<ServerContext[]>('servers', []);

    const connectTo = useCallback(async (server: ServerContext) => {

        let {url, token, mode, name, username} = server;
        let {password} = login;

        if (!url)
            return toast.error(`Server url not entered`);

        // Login (try to get token)
        if (mode == 'login') {
            if (!username || !password)
                return toast.error('Username or password is empty');

            setLoading(true);
            setLoadingMessage(`Loggin to server ...`);
            try {
                let result = await serverRequest({ url }, `/login`, { username, password });
                if (result.ok) {
                    token = result.token;
                }
                else {
                    throw Error(`Authentication failed`);
                }
            } catch (err) {
                toast.error(err?.message);
                return;
            }
            finally {
                setLoading(false);
            }
        }
        
        // Check authenticate by token
        setLoading(true);
        setLoadingMessage('Authenticating ...');
        try {
            let result = await serverRequest({ url, token }, `/authenticate`);
            // Authenticated
            if (result.ok) {

                // Set context
                context.setServer({ ...server, token });

                // Update stored servers
                let storedServer = servers.find(x => x.url == url && x.username == username);
                // Update
                if (storedServer) {
                    storedServer.token = token;
                    storedServer.name = name;
                    storedServer.mode = 'token';
                }
                // Insert
                else {
                    servers.push({ ...server, mode: 'token' });
                }

                setLoadingMessage('OK, Redirect ...');
                setServers([ ...servers ]);
                router.push(`/users`);

            }
        }
        catch (err) {
            toast.error(err?.message);
            setLoading(false);
        }
    }, [context, servers, login]);

    let onSubmit = useCallback((e: FormEvent) => {
        e?.preventDefault();
        connectTo(server);
    }, [connectTo, server]);

    const removeServer = useCallback((server: ServerContext) => {
        setServers([ ...servers.filter(x => x.url != server.url || x.username != server.username) ]);
    }, [servers, setServers]);


    return <div className="flex flex-col items-center justify-center h-screen">
        <Head>
            <title>Server Connect</title>
        </Head>
        <Loading isLoading={loading}>{loadingMessage}</Loading>
        <form onSubmit={onSubmit}>
        <h1 className="font-light text-2xl mb-4 flex flex-row gap-x-2 items-center">
            <ServerIcon className="w-7 text-slate-300"/>
            <span>Server Connect</span>
        </h1>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem]">
            {loading ?
            <div className="flex flex-row gap-x-2 items-center justify-center py-5">
                <GlobeAsiaAustraliaIcon className="w-6 animate-spin"/>
                {loadingMessage}
            </div>
            :
                <>
                <div className="flex flex-row px-1 border-b-[1px] pb-1 mb-1">
                    <label className={styles.label + ' flex-1'}>Mode</label>
                    <div className="flex flex-row gap-x-2 items-center text-sm">
                        <div className="flex flex-row border-[1px] border-slate-300 rounded-xl overflow-hidden text-slate-900 text-xs">
                            <span onClick={() => setServer({ ...server, mode: 'login' })} className={classNames("cursor-pointer px-3 py-1", { 'bg-slate-300': server.mode == 'login' })}>Login</span>
                            {/* <span onClick={() => setServer({ ...server, mode: 'token' })} className={classNames("cursor-pointer px-3 py-1 border-l-[1px] border-l-slate-300", { 'bg-slate-300': server.mode == 'token' })}>Token</span> */}
                        </div>
                    </div>
                </div>
                <FieldsGroup data={server} dataSetter={setServer}>
                    <Field label="Server URL" htmlFor="url">
                        <input type="text" placeholder="http://" className={styles.input} id="url"/>
                    </Field>
                    {server.mode == 'token' ?
                    <Field label="Server Token" htmlFor="token">
                        <input type="password" placeholder="Server Token" className={styles.input} id="token"/>
                    </Field> : null}
                    {server.mode == 'login' ? <>
                        <Field label="Username" htmlFor="username">
                            <input type="text" placeholder="Username" className={styles.input} id="username"/>
                        </Field>
                        <FieldsGroup data={login} dataSetter={setLogin}>
                            <Field label="Password" htmlFor="password">
                                <input type="password" placeholder="Password" className={styles.input} id="password"/>
                            </Field>
                        </FieldsGroup>
                    </> : null}
                    <Field label="Server Name" htmlFor="name">
                        <input type="text" placeholder="My Server" className={styles.input} id="name"/>
                    </Field>
                </FieldsGroup>
                <div className="flex flex-row pt-4 justify-end">
                    <button type="submit" className={styles.buttonItem}>
                        <BoltIcon className="w-4"/>
                        Connect
                    </button>
                </div>
                </>
            }
        </div>
        </form>
        {!loading ?
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem] mt-3 text-sm">
            <span className="font-bold mb-3 flex flex-row gap-x-2 items-center">
                <ServerStackIcon className="w-4"/>
                Servers
            </span>
            {servers.map((x, index) => <div key={index} className="text-sm py-2 px-2 hover:bg-slate-100 rounded-md cursor-pointer border-b-[1px] flex last:border-b-0 gap-x-4">
                <ServerIcon onClick={() => connectTo(x)} className="w-6 text-slate-400"/>
                <div onClick={() => connectTo(x)} className="flex flex-col flex-1">
                    {x.name ? <span className="font-bold">{x.name} {x.username ? `(${x.username})` : null}</span> : null}
                    <span className="flex-1">{x.url}</span>
                </div>
                <span onClick={() => removeServer(x)} className="block self-center font-bold p-2 hover:bg-red-600 hover:text-white rounded-full">
                    <TrashIcon className="w-4"/>
                </span>
            </div>)}
        </div> : null }
    </div>
}