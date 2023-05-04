import { ChevronUpDownIcon, MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import React, { HTMLProps, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useOutsideAlerter } from "../lib/hooks";
import { styles } from "../lib/styles";

export interface SelectProps<T> extends HTMLProps<HTMLSelectElement> {
    items?: T[]
    valueMember?: keyof T | ((item: T) => any)
    displayMember?: keyof T | ((item: T) => any)
    nullText?: string
    allowNull?: boolean
}

export function Select<T>({items, value, onChange, nullText = 'No item selected', valueMember, displayMember, allowNull = true, ...props}: SelectProps<T>) {

    let [showPopup, setShowPopup] = useState(false);
    const [filter, setFilter] = useState('');
    const refPopup = useRef<HTMLDivElement>();
    const refSearch = useRef<HTMLInputElement>();
    const [focusIndex, setFocusIndex] = useState(0);

    const onClick = useCallback((e: any) => {
        e?.preventDefault();
        setShowPopup(true);
    }, [setShowPopup]);

    const onSelect = useCallback((value: any) => {
        onChange && onChange({
            currentTarget: {
                value
            }
        } as any);
        setShowPopup(false);
    }, [setShowPopup, onChange]);

    const getDisplay = (x: any) => displayMember ? typeof displayMember == 'function' ? displayMember(x) : x[displayMember] : x;
    const getValue = (x: any) => valueMember ? typeof valueMember == 'function' ? valueMember(x) : x[valueMember] : x;

    const selectedItem = value && items && displayMember && valueMember ? items.find(x => getValue(x) == value) : value;

    useOutsideAlerter(refPopup, () => {
        setShowPopup(false);
    });

    useEffect(() => { showPopup ? refSearch?.current?.focus() : null }, [showPopup]);
    useEffect(() => setFocusIndex(0), [filter]);

    const visibleItems = items?.filter(x => !filter || String(getValue(x)).toLowerCase().includes(filter?.toLowerCase())) ?? [];

    const onKeyDown = useCallback((e: KeyboardEvent) => {
        if (e?.code == 'ArrowUp') {
            setFocusIndex(Math.max(0, focusIndex - 1));
        }
        else if (e?.code == 'ArrowDown') {
            setFocusIndex(Math.min(visibleItems.length - 1, focusIndex + 1));
        }
        else if (e?.code == 'Enter') {
            if (visibleItems[focusIndex]) {
                onSelect(getValue(visibleItems[focusIndex]));
            }
            else {
                setShowPopup(false);
            }
        }    
        else if (e?.code == 'Escape') {
            setShowPopup(false);
        }    
    }, [focusIndex, visibleItems]);

    return <div className={classNames("flex relative")}>
        <div onClick={onClick} className={classNames(styles.input, 'select-none flex flex-row items-center gap-x-2')}>
            {selectedItem ? getDisplay(selectedItem) : <span className="text-gray-400 italic">{nullText}</span>}
            <ChevronUpDownIcon className="w-4"/>
        </div>
        {showPopup ?
        <div ref={refPopup} className="absolute top-0 z-[1000] bg-white rounded-md shadow-lg ring-1 ring-gray-300 overflow-hidden">
            <div className="border-b-2 flex flex-row items-center min-w-[150px]">
                <MagnifyingGlassIcon className="w-6 ml-2"/>
                <input ref={refSearch} onKeyDown={onKeyDown} value={filter} onChange={e => setFilter(e?.currentTarget?.value)} type="text" placeholder="Search ..." className="w-full px-3 py-2 outline-none"/>
                <XCircleIcon className="w-6 mr-2 cursor-pointer hover:text-red-600" onClick={e => onSelect(null)}/>
            </div>
            <div className="max-h-56 overflow-y-scroll overflow-x-hidden px-2 py-2">
                {visibleItems.map((x, index) => {
                    let itemDisplay = getDisplay(x);
                    let itemValue = getValue(x);
                    return <div key={index} onMouseOver={e => setFocusIndex(index)} onClick={e => onSelect(itemValue)} className={classNames("px-2 py-1 select-none rounded-md whitespace-nowrap", { 'bg-blue-900 text-white': value == itemValue, 'bg-slate-100': value != itemValue && focusIndex == index })}>{itemDisplay}</div>
                })}
            </div>
        </div> : null}
    </div>
}