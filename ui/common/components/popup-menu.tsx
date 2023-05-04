import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { useOutsideAlerter } from "../lib/hooks";
import { styles } from "../lib/styles";
import { ChildOf } from "../types";

interface PopupMenuItemProps {
    visible?: boolean
    icon?: any
    children: any
    action?: (setVisible: React.Dispatch<React.SetStateAction<boolean>>) => any
}

function PopupMenuItem({ children, action, icon, visible }: PopupMenuItemProps) {

    if (typeof visible != 'undefined' && !visible) return null;

    return <div className="py-1 px-2 border-b-[1px] border-b-gray-200 last:border-b-0 hover:bg-cyan-100 cursor-pointer" onClick={() => { action?.call(this) }}>
        <div className="flex flex-row gap-x-2">
            {icon}
            <span>{children}</span>
        </div>
    </div>
}

interface PopupMenuProps {
    visible?: boolean,
    text?: any,
    children?: ChildOf<typeof PopupMenuItem, PopupMenuItemProps>
    emptyText?: any
} 

export function PopupMenu({ visible = false, text = 'Actions', emptyText = '-', children = [] }: PopupMenuProps) {
    let [isVisible, setVisible] = useState(visible);
    let refPopup = useRef();
    useOutsideAlerter(refPopup, () => {
        setVisible(false);
    });

    useEffect(() => { if (typeof visible == 'boolean') setVisible(visible) }, [visible, setVisible]);

    let visibleItems = (Array.isArray(children) ? children : [children]).filter(x => !!x && (typeof x.props.visible == 'undefined' || x.props.visible));

    if (visibleItems.length == 0) return emptyText;

    return <div className="relative inline-block">
        <span onClick={() => setVisible(!isVisible)} className={classNames(styles.link, { 'bg-slate-200': isVisible })}>{text}</span>
        {isVisible ? 
        <div ref={refPopup} className="min-w-[10rem] absolute z-50 right-0 top-full bg-white shadow-lg ring-1 ring-black ring-opacity-10 px-2 py-2 rounded-lg">
            {children}
        </div> : null }
    </div>
}


PopupMenu.Item = PopupMenuItem;
