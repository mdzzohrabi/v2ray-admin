// @ts-check
import { useRouter } from "next/router";
import React from "react";
import { useEffect } from "react";
import { useCallback, useContext, useState } from "react"
import toast from "react-hot-toast";
import { AppContext } from "../components/app-context"
import { Field, FieldsGroup } from "../components/fields";
import { store, stored } from "../lib/util";

export default function ServerConfig() {
    let context = useContext(AppContext);
    let router = useRouter();
    let showAll = router.query.all == '1';

    let [server, setServer] = useState({
        url: context?.server?.url, token: context?.server?.token, name: context?.server?.name
    })

    /**
     * @type {[import("../components/app-context").ServerContext[], import("react").Dispatch<import("react").SetStateAction<import("../components/app-context").ServerContext[]>>]}
     */
    let [servers, setServers] = useState(stored('servers') ?? []);

    useEffect(() => {
        store('servers', servers);
    }, [servers]);
    
    let connect = useCallback((e, /** @type {import("../components/app-context").ServerContext} */ server) => {
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

    const removeServer = useCallback((/** @type {string} */ url) => {
        setServers([ ...servers.filter(x => x.url != url) ]);
    }, [servers, setServers]);

    const connectTo = useCallback(/** @type {import("../components/app-context").ServerContext} */ server => {
        connect(null, server);
    }, [server, connect]);

    return <div className="flex flex-col items-center justify-center h-screen">
        <form onSubmit={e => connect(e, server)}>
        <h1 className="font-light text-2xl mb-4">Server Config</h1>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem]">
            <FieldsGroup data={server} dataSetter={server => setServer(server)}>
                <Field label="Server URL" htmlFor="url">
                    <input type="text" placeholder="http://" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="url"/>
                </Field>
                <Field label="Server Token" htmlFor="token">
                    <input type="password" placeholder="Server Token" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="token"/>
                </Field>
                <Field label="Server Name" htmlFor="name">
                    <input type="text" placeholder="My Server" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="name"/>
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