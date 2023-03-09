// @ts-check
import React, { createContext, useEffect, useState, Dispatch, SetStateAction, Context } from "react";
import { store, stored } from "../lib/util";

/**
 * @typedef {{
 *      url: string,
 *      token: string,
 *      name?: string,
 *      node?: string
 * }} ServerContext
 * 
 * @typedef {{
 *      server: ServerContext,
 *      setServer: Dispatch<SetStateAction<ServerContext>>,
 * }} AppContext
 */

/** @type {Context<AppContext>} */
// @ts-ignore
export const AppContext = createContext({});

export function AppContextContainer({ children }) {
    let [server, setServer] = useState(stored('server', { url: '', token: '' }));

    useEffect(() => {
        store('server', server);
    }, [server]);

    // useEffect(() => store('server-node', node), [node]);

    return <AppContext.Provider value={{ server, setServer }}>
        {children}
    </AppContext.Provider>;
}