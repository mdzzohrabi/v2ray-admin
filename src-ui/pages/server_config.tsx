import { useRouter } from "next/router";
import { FormEvent, useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";
import { AppContext, ServerContext } from "../components/app-context";
import { Field, FieldsGroup } from "../components/fields";
import { useStoredState } from "../lib/hooks";
import { styles } from "../lib/styles";

export default function ServerConfig() {
    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';

    let [mode, setMode] = useState<'token' | 'login'>('login');

    let [server, setServer] = useState({
        url: context?.server?.url,
        token: context?.server?.token,
        name: context?.server?.name
    })

    let [login, setLogin] = useState({ username: '', password: '' });

    let [servers, setServers] = useStoredState<ServerContext[]>('servers', []);
    
    let connect = useCallback((e: FormEvent, server: ServerContext) => {
        e?.preventDefault();
        let {url, token} = server;
        if (!!url && !!token) {
            context.setServer(server);
            let foundServer = servers.find(x => x.url == url);
            
            // Update Token
            if (foundServer) {
                foundServer.token = token;
                foundServer.name = server.name;
            // Insert server
            } else
                servers.push(server);

            setServers([ ...servers ]);
            router.push('/users' + (showAll ? '?all=1' : ''));
        } else {
            toast.error("Please enter valid server config");
        }
    }, [context, servers]);

    const removeServer = useCallback((url: string) => {
        setServers([ ...servers.filter(x => x.url != url) ]);
    }, [servers, setServers]);

    const connectTo = useCallback((server: ServerContext) => {
        connect(null, server);
    }, [server, connect]);

    return <div className="flex flex-col items-center justify-center h-screen">
        <form onSubmit={e => connect(e, server)}>
        <h1 className="font-light text-2xl mb-4">Server Config</h1>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem]">
            <div className="flex flex-row px-1 border-b-[1px] pb-1 mb-1">
                <label className={styles.label + ' flex-1'}>Mode</label>
                <div className="flex flex-row gap-x-2 items-center text-sm">
                    <label htmlFor="login">Login</label>
                    <input checked={mode=='login'} onChange={e => setMode(e.target.value as any)} type="radio" value={'login'} name="mode" id="login"/>
                    <label htmlFor="token">Token</label>
                    <input checked={mode=='token'} onChange={e => setMode(e.target.value as any)} type="radio" value={'token'} name="mode" id="token"/>
                </div>
            </div>
            <FieldsGroup data={server} dataSetter={setServer}>
                <Field label="Server URL" htmlFor="url">
                    <input type="text" placeholder="http://" className={styles.input} id="url"/>
                </Field>
                {mode == 'token' ?
                <Field label="Server Token" htmlFor="token">
                    <input type="password" placeholder="Server Token" className={styles.input} id="token"/>
                </Field> : null}
                {mode == 'login' ? <>
                    <FieldsGroup data={login} dataSetter={setLogin}>
                        <Field label="Username" htmlFor="username">
                            <input type="text" placeholder="Username" className={styles.input} id="username"/>
                        </Field>
                        <Field label="Password" htmlFor="password">
                            <input type="password" placeholder="Password" className={styles.input} id="password"/>
                        </Field>
                    </FieldsGroup>
                </> : null}
                <Field label="Server Name" htmlFor="name">
                    <input type="text" placeholder="My Server" className={styles.input} id="name"/>
                </Field>
            </FieldsGroup>
            <button type="submit" className="mt-2 py-1 bg-slate-300 rounded-lg hover:bg-slate-800 hover:text-white">Connect</button>
        </div>
        </form>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem] mt-3 text-sm">
            <span className="font-bold mb-3">Servers</span>
            {servers.map(x => <div key={x.url} className="text-sm py-2 px-2 hover:bg-slate-100 rounded-sm cursor-pointer border-b-[1px] flex last:border-b-0">
                <div className="flex flex-col flex-1">
                    {x.name ? <span className="font-bold">{x.name}</span> : null}
                    <span onClick={() => connectTo(x)} className="flex-1">{x.url}</span>
                </div>
                <span onClick={() => removeServer(x.url)} className="block self-center font-bold px-3 hover:bg-red-600 hover:text-white rounded-full">X</span>
            </div>)}
        </div>
    </div>
}