// @ts-check
import React, { createContext, Fragment, useCallback, useContext, useState } from "react";

export const DialogContext = createContext({ dialogs: [], setDialogs: (dialogs) => null });

/**
 * Dialog
 * @template {Function} T
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
    
    // @ts-ignore
    return <DialogContext.Provider value={{ dialogs, setDialogs }}>
        {children}
        {dialogs.length > 0 ? 
        <div id="dialogs-container" className="fixed flex items-center justify-center z-[100] top-0 left-0 w-full h-full">
            {dialogs.map((dialog, index) => {
                
                return <Fragment key={index}>
                    <div onClick={() => closeDialog(dialog)} className="absolute backdrop-blur-sm top-0 left-0 w-full h-full bg-black bg-opacity-10"></div>
                    <div key={index} className={"z-[101] max-h-full"}>
                        {
                        // @ts-ignore
                        dialog(() => closeDialog(dialog))}
                    </div>
                </Fragment>
            })}
        </div> : null }
    </DialogContext.Provider>
}

/**
 * Dialog
 * @param {{    
 *      children?: any,
 *      title?: string,
 *      onClose?: any,
 *      onSubmit?: (event: import("react").FormEvent) => any
 * }} param0 
 * @returns 
 */
export function Dialog({ children, title = undefined, onClose = undefined, onSubmit = undefined }) {

    let elDialog = <div className="bg-white rounded-xl p-2 min-w-[30rem] flex flex-col max-h-[90vh]">
        <div className="flex flex-row px-1 pb-2">
            <span className="flex-1 font-bold">{title}</span>
            <div>
                {onClose ? <span onClick={onClose} className="aspect-square bg-slate-200 rounded-full px-2 py-1 text-gray-600 cursor-pointer hover:bg-slate-900 hover:text-white">X</span> : null }
            </div>
        </div>
        <div className="overflow-auto">
            {children}
        </div>
    </div>;

    if (onSubmit)
        return <form onSubmit={onSubmit}>{elDialog}</form>

    return elDialog;
}