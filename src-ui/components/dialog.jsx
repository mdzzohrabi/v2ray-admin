import { Fragment, useState } from "react";
import { useCallback } from "react";
import { useContext } from "react";
import { createContext } from "react"

export const DialogContext = createContext({ dialogs: [], setDialogs: () => null });

/**
 * Dialog
 * @param {(...props) => any} builder Dialog builder
 * @returns 
 */
export function useDialog(builder) {
    let { dialogs, setDialogs } = useContext(DialogContext);

    return {
        show(props) {
            let el = builder.apply(dialogs, props);
            setDialogs([ ...dialogs, el ]);
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
                    <div key={index} className={"z-[101]"}>{dialog}</div>
                </Fragment>
            })}
        </div> : null }
    </DialogContext.Provider>
}