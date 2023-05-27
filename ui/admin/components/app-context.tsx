import { checkReact, useStoredState } from "@common/lib/hooks";
import React, { createContext, Dispatch, SetStateAction, useMemo } from "react";
import { serverRequest } from "../lib/util";


export interface ServerContext {
    url?: string,
    token?: string,
    name?: string,
    node?: string
    username?: string
    mode?: 'login' | 'token'
}

export interface AppContext {
    server: ServerContext,
    setServer: Dispatch<SetStateAction<ServerContext>>,
    isStoreLoaded: boolean
    request: typeof serverRequest
}

export const AppContext = createContext<AppContext>({} as any);

export function AppContextContainer({ children }) {
    checkReact(React);
    let [server, setServer, isStoreLoaded] = useStoredState('server', { url: '', token: '' });
    let context = useMemo(() => {
        console.log('Context changed');        
        return {server, setServer, isStoreLoaded, request: serverRequest.bind(this, server)};
    }, [server, setServer, isStoreLoaded]);

    return <AppContext.Provider value={context}>
        {children}  
    </AppContext.Provider>;
}