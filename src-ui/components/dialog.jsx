import { Fragment, useState } from "react";
import { useCallback } from "react";
import { useContext } from "react";
import { createContext } from "react"

export const DialogContext = createContext({ dialogs: [], setDialogs: () => null });

/**
 * Dialog
 * @template T
 * @param {T} builder Dialog builder
 * @returns 
 */
export function useDialog(builder) {
    let { dialogs, setDialogs } = useContext(DialogContext);

    let closeDialog = useCallback((dialog) => {
        setDialogs(dialogs.filter(x => x != dialog));
    }, [dialogs]);

    return {
        /**
         * Show dialog
         * @param {Parameters<T>} props Builder properties
         */
        show(...props) {
            let boundBuilder = builder.bind(dialogs, ...props);
            setDialogs([ ...dialogs, boundBuilder ]);
        }
    }
}

export function DialogsContainer({ children }) {
    let [dialogs, setDialogs] = useState([]);

    let closeDialog = useCallback((dialog) => {
        setDialogs(dialogs.filter(x => x != dialog));
    }, [dialogs]);
    
    return <DialogContext.Provider value={{ dialogs, setDialogs }}>
        {children}
        {dialogs.length > 0 ? 
        <div id="dialogs-container" className="fixed flex items-center justify-center z-[100] top-0 left-0 w-full h-full">
            {dialogs.slice(-1, 1).map((dialog, index) => {
                return <Fragment key={index}>
                    <div onClick={() => closeDialog(dialog)} className="absolute backdrop-blur-sm top-0 left-0 w-full h-full bg-black bg-opacity-10"></div>
                    <div key={index} className={"z-[101]"}>{dialog(() => closeDialog(dialog))}</div>
                </Fragment>
            })}
        </div> : null }
    </DialogContext.Provider>
}