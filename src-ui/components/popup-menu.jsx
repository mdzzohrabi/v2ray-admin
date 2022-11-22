import classNames from "classnames";
import React, { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react"
import { useOutsideAlerter } from "../hooks";


/**
 * 
 * @param {{ children: any, action?: (setVisible: React.Dispatch<React.SetStateAction<boolean>>) => any }} param0 
 */
function PopupMenuItem({ children, action }) {
    return <div></div>;
}

/**
 * 
 * @param {{
 *      visible?: boolean,
 *      text?: string,
 *      children?: (React.ComponentElement<typeof PopupMenuItem> | null)[] | React.ComponentElement<typeof PopupMenuItem> | null
 * }} params0 Parameters
 */
export function PopupMenu({ visible = false, text = 'Actions', children = [] }) {
    let [isVisible, setVisible] = useState(visible);
    let refPopup = useRef();
    useOutsideAlerter(refPopup, () => {
        setVisible(false);
    });

    useEffect(() => { if (typeof visible == 'boolean') setVisible(visible) }, [visible, setVisible]);

    return <div className="relative inline-block">
        <span onClick={() => setVisible(!isVisible)} className={classNames("cursor-pointer block text-blue-800 hover:underline py-1 px-2 rounded-lg", { 'bg-slate-200': isVisible })}>{text}</span>
        {isVisible ? 
        <div ref={refPopup} className="min-w-[10rem] absolute z-50 right-0 top-full bg-white shadow-lg ring-1 ring-black ring-opacity-10 px-2 py-2 rounded-lg">
            {(Array.isArray(children) ? children : [children]).map((action, index) => {
                if (!action) return null;
                return <div key={index} className="py-1 px-2 border-b-[1px] border-b-gray-200 last:border-b-0 hover:bg-cyan-100 cursor-pointer" onClick={() => { action.props.action?.call(this, setVisible) }}>
                    {action.props.children}
                </div>
            })}
        </div> : null }
    </div>
}


PopupMenu.Item = PopupMenuItem;
