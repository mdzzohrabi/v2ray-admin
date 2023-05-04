import classNames from "classnames";
import React, { createContext, FormEvent, Fragment, HTMLProps, useCallback, useContext, useState } from "react";

export const DialogContext = createContext({ dialogs: [], setDialogs: (dialogs) => null });

export function useDialog<T extends (...args: any) => any>(builder: T) {
    let { dialogs, setDialogs } = useContext(DialogContext);

    let closeDialog = useCallback((dialog) => {
        setDialogs(dialogs.filter(x => x != dialog));
    }, [dialogs]);

    return {
        /**
         * Show dialog
         */
        show(...props: Parameters<T>) {
            let boundBuilder = builder.bind(dialogs, ...(props as any));
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

interface DialogProps extends HTMLProps<HTMLDivElement> {
    children?: any
    title?: string
    onClose?: any
    onSubmit?: (event: FormEvent) => any
}

export function Dialog({ children, title = undefined, onClose = undefined, onSubmit = undefined, className, ...props }: DialogProps) {

    let elDialog = <div className="bg-white rounded-xl p-2 md:min-w-[30rem] flex flex-col max-h-[90vh] text-xs md:text-sm lg:text-base">
        <div className="flex flex-row px-1 pb-2">
            <span className="flex-1 font-bold">{title}</span>
            <div>
                {onClose ? <span onClick={onClose} className="aspect-square bg-slate-200 rounded-full px-2 py-1 text-gray-600 cursor-pointer hover:bg-slate-900 hover:text-white">X</span> : null }
            </div>
        </div>
        <div className={classNames("overflow-auto", className)} {...props}>
            {children}
        </div>
    </div>;

    if (onSubmit)
        return <form onSubmit={onSubmit}>{elDialog}</form>

    return elDialog;
}