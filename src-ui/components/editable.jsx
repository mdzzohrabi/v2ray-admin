import { useCallback, useState } from "react";

export function Editable({ value, children, onEdit }) {
    let [isEdit, setEdit] = useState(false);
    let [valueState, setValueState] = useState(value);

    const onSubmit = useCallback((e) => {
        e?.preventDefault();
        onEdit?.call(this, [ valueState ]);
        setEdit(false);
    }, [valueState]);

    if (!isEdit) return <>
        {children}
        <span className="text-blue-500 text-sm ml-2 cursor-pointer px-1 rounded-lg hover:bg-slate-600 hover:text-white" onClick={() => setEdit(!isEdit)}>Edit</span>
    </>;

    return <form onSubmit={onSubmit}>
        <input type={"text"} value={valueState} onChange={e => setValueState(e.currentTarget.value)} className="ring-1 ring-slate-600 rounded-lg px-1"/>
        <button className="text-sm ml-1 bg-slate-200 rounded-lg px-2 hover:bg-slate-800 hover:text-white" type="submit">OK</button>
        <button onClick={() => setEdit(false)} className="text-sm ml-1 bg-slate-200 rounded-lg px-2 hover:bg-slate-800 hover:text-white" type="button">Cancel</button>
    </form>
}