import { useRouter } from "next/router";
import { useEffect } from "react";
import { useCallback, useContext, useState } from "react"
import toast from "react-hot-toast";
import { AppContext } from "../components/app-context"
import { store, stored } from "../util";

export default function ServerConfig() {
    let context = useContext(AppContext);
    let router = useRouter();

    let [url, setUrl] = useState(context.server.url);
    let [token, setToken] = useState(context.server.token);
    /**
     * @type {[import("../components/app-context").ServerContext[], import("react").Dispatch<import("react").SetStateAction<import("../components/app-context").ServerContext[]>>]}
     */
    let [servers, setServers] = useState(stored('servers') ?? []);

    useEffect(() => {
        store('servers', servers);
    }, [servers]);
    
    let connect = useCallback((e, url, token) => {
        e?.preventDefault();
        if (!!url && !!token) {
            context.setServer({
                token, url
            });
            let server = servers.find(x => x.url == url);
            if (server)
                server.token = token;
            else
                servers.push({ url, token });
            setServers([ ...servers ]);
            router.push('/users');
        } else {
            toast.error("Please enter valid server config");
        }
    }, [context, servers]);

    const removeServer = useCallback((url) => {
        setServers([ ...servers.filter(x => x.url != url) ]);
    }, [servers, setServers]);

    const connectTo = useCallback((url, token) => {
        connect(null, url, token);
    }, [setUrl, setToken, connect]);

    return <div className="flex flex-col items-center justify-center h-screen">
        <form onSubmit={e => connect(e, url, token)}>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem]">
            <label htmlFor="url" className="font-bold block">Server Url</label>
            <input value={url} onChange={e => setUrl(e.currentTarget.value)} type="text" placeholder="http://" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="url"/>

            <label htmlFor="token" className="font-bold block mt-2">Server Token</label>
            <input value={token} onChange={e => setToken(e.currentTarget.value)} type="password" placeholder="Server Token" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="token"/>

            <button type="submit" className="mt-2 py-1 bg-slate-300 rounded-lg hover:bg-slate-800 hover:text-white">Connect</button>
        </div>
        </form>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem] mt-3 text-sm">
            <span className="font-bold">Recently</span>
            {servers.map(x => <div key={x.url} className="text-sm py-2 px-2 hover:bg-slate-100 rounded-sm cursor-pointer border-b-[1px] flex">
                <span onClick={() => connectTo(x.url, x.token)} className="flex-1">{x.url}</span>
                <span onClick={() => removeServer(x.url)} className="block font-bold px-3 hover:bg-red-600 hover:text-white rounded-full">X</span>
            </div>)}
        </div>
    </div>
}