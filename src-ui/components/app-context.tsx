// @ts-check
import React, { createContext, useEffect, useState, Dispatch, SetStateAction, Context } from "react";
import { useStoredState } from "../lib/hooks";
import { store, stored } from "../lib/util";


export interface ServerContext {
     url: string,
     token: string,
     name?: string,
     node?: string
}

export interface AppContext {
     server: ServerContext,
     setServer: Dispatch<SetStateAction<ServerContext>>,
}


export const AppContext = createContext<AppContext>({} as any);

export function AppContextContainer({ children }) {
    let [server, setServer] = useStoredState('server', { url: '', token: '' });

    return <AppContext.Provider value={{ server, setServer }}>
        {children}
    </AppContext.Provider>;
}