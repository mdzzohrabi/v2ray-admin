import { Context, createContext, Dispatch, SetStateAction, useEffect, useState } from "react";
import { store, stored } from "../lib/util";

/**
 * @typedef {{ url: string, token: string }} ServerContext
 * 
 * @typedef {{ server: ServerContext, setServer: Dispatch<SetStateAction<ServerContext>> }} AppContext
 */

/** @type {Context<AppContext>} */
export const AppContext = createContext();

export function AppContextContainer({ children }) {
    let [server, setServer] = useState(stored('server') ?? { url: '', token: '' });

    useEffect(() => {
        store('server', server);
    }, [server]);

    return <AppContext.Provider value={{ server, setServer }}>
        {children}
    </AppContext.Provider>;
}