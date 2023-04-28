import classNames from "classnames";
import { HTMLProps, useCallback, useEffect, useState } from "react";
import { Select } from "./select";

interface EditableProps {
    value?: any
    children?: any
    onEdit?: Function
    className?: any
    editable?: boolean
    input?: HTMLProps<HTMLInputElement>
    postfix?: any
    editor?: (value?: any, onChange?: Function) => any
    items?: any[]
}

/**
 * Editable
 */
export function Editable({ value, children, onEdit, className = '', editable = true, input, postfix, editor, items }: EditableProps) {
    let [isEdit, setEdit] = useState(false);
    let [valueState, setValueState] = useState(value);

    useEffect(() => { setValueState(value) }, [value])

    const onSubmit = useCallback((e) => {
        e?.preventDefault();
        onEdit?.call(this, valueState);
        setEdit(false);
    }, [valueState]);

    // if (!isEdit) return <>
    //     {children}
    //     <span className="text-blue-500 text-sm ml-2 cursor-pointer px-1 rounded-lg hover:bg-slate-600 hover:text-white" onClick={() => setEdit(!isEdit)}>Edit</span>
    // </>;

    if (!editable)
        return <span className={classNames("ml-2 px-1",className)}>
            {children}
        </span>;

    if (!isEdit)
        return <span className={classNames("text-blue-500 ml-2 cursor-pointer px-1 rounded-lg hover:ring-slate-400 hover:ring-1 block", className)} onClick={() => setEdit(!isEdit)}>{children}</span>;

    return <form onSubmit={onSubmit}>
        {
            editor ?
                editor(valueState, e => setValueState(e.currentTarget.value)) :
                (items ?
                    <Select items={items} value={valueState} onChange={e => setValueState(e.currentTarget.value)}/> :
                    <input type={"text"} value={valueState} onChange={e => setValueState(e.currentTarget.value)} className="ring-1 ring-slate-600 rounded-lg px-1" {...input}/>
                )
        }
        {postfix}
        <button className="text-sm ml-1 bg-slate-200 rounded-lg px-2 hover:bg-slate-800 hover:text-white" type="submit">OK</button>
        <button onClick={() => setEdit(false)} className="text-sm ml-1 bg-slate-200 rounded-lg px-2 hover:bg-slate-800 hover:text-white" type="button">Cancel</button>
    </form>
}