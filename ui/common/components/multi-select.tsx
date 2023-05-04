import classNames from "classnames"
import { ChangeEvent, HTMLProps, useCallback, useState } from "react"
import { styles } from "../lib/styles"
import { Select } from "./select"


export interface MultiSelectProps<T, VM extends keyof T, DM extends keyof T, V extends T[VM]> extends Omit<HTMLProps<HTMLSelectElement>, 'value'> {
    items?: T[]
    value?: V[]
    valueMember?: VM
    displayMember?: DM | ((item: T) => any)
}

export function MultiSelect<T, VM extends keyof T, DM extends keyof T, V extends T[VM]>({ items, value, onChange, className, valueMember, displayMember, id, ...props }: MultiSelectProps<T, VM, DM, V>) {

    const [selectValue, setSelectValue] = useState('');

    const setData = useCallback((data?: any[]) => {
        if (onChange)
            onChange({
                currentTarget: {
                    value: data
                }
            } as any);
    }, [onChange]);

    const onSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        let newValue = e?.currentTarget?.value;
        setSelectValue(newValue);
        if (!!newValue)
            setData([ ...(value ?? []), newValue ])
        else
            setData([]);
    }, [setSelectValue, value]);

   return <div className="flex items-center justify-center gap-x-1">
        <div className="flex gap-1 items-center justify-center">
            {value?.map((v, index) => {
                let displayText = String(v);
                if (valueMember && displayMember) {
                    let item = items?.find(x => x[valueMember] == v)
                    if (item) displayText = String(typeof displayMember == 'function' ? displayMember(item) : item[displayMember]);
                }
                return <span key={index} onClick={() => setData(value.filter(x => x != v))} className={classNames("whitespace-nowrap bg-slate-200 px-3 py-1 rounded-3xl cursor-pointer hover:bg-slate-700 hover:text-white")}>
                    {displayText}
                </span>
            })}
        </div>
        <Select value={selectValue} onChange={onSelectChange} id={id} className={className ?? styles.input} allowNull={true} displayMember={displayMember} valueMember={valueMember} items={[
            ...(items ?? [])
        ]} {...props}>
            {/* <option value="">-</option>
            {(items ?? []).map((x, index) => <option key={index} value={String(valueMember ? x[valueMember] : x)}>{String(displayMember ? x[displayMember] : x)}</option>)} */}
        </Select>
    </div>
}