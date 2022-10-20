import { useRouter } from "next/router";
import { useCallback, useContext, useState } from "react"
import toast from "react-hot-toast";
import { AppContext } from "../components/app-context"

export default function ServerConfig() {
    let context = useContext(AppContext);
    let router = useRouter();

    let [url, setUrl] = useState(context.server.url);
    let [token, setToken] = useState(context.server.token);
    
    let connect = useCallback((e) => {
        e?.preventDefault();
        if (!!url && !!token) {
            context.setServer({
                token, url
            });
            router.push('/users');
        } else {
            toast.error("Please enter valid server config");
        }
    }, [url, token, context]);

    return <div className="flex items-center justify-center h-screen">
        <form onSubmit={connect}>
        <div className="bg-white rounded-lg shadow-md px-3 py-3 flex flex-col min-w-[20rem]">
            <label htmlFor="url" className="font-bold block">Server Url</label>
            <input value={url} onChange={e => setUrl(e.currentTarget.value)} type="text" placeholder="http://" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="url"/>

            <label htmlFor="token" className="font-bold block mt-2">Server Token</label>
            <input value={token} onChange={e => setToken(e.currentTarget.value)} type="text" placeholder="Server Token" className="w-full px-2 py-1 ring-1 ring-slate-600 rounded-md" id="token"/>

            <button type="submit" className="mt-2 py-1 bg-slate-300 rounded-lg hover:bg-slate-800 hover:text-white">Connect</button>
        </div>
        </form>
    </div>
}