import { createContext, Dispatch, SetStateAction, useMemo } from "react";
import { useStoredState } from "../lib/hooks";


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
}


export const AppContext = createContext<AppContext>({} as any);

export function AppContextContainer({ children }) {
    let [server, setServer, isStoreLoaded] = useStoredState('server', { url: '', token: '' });

    let context = useMemo(() => {
        return {server, setServer, isStoreLoaded};
    }, [server, setServer, isStoreLoaded]);

    return <AppContext.Provider value={context}>
        {children}  
    </AppContext.Provider>;
}