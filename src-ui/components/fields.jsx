// @ts-check

import classNames from "classnames";
import React from "react";
import { useCallback } from "react";
import { createElement } from "react";
import { styles } from "../styles";

/**
 * Fields group
 * @param {React.HTMLAttributes<HTMLDivElement> & { children?: any, title?: string, titleClassName?: string, horizontal?: boolean, data?: any, dataSetter?: Function }} param0 
 * @returns 
 */
export function FieldsGroup({ title, children, className, titleClassName, horizontal = false, data = undefined, dataSetter = undefined, ...props }) {
    return <div className={classNames("flex text-sm overflow-auto",className)} {...props}>
        {title ? <h2 className={classNames("font-bold px-3 py-3 whitespace-nowrap", titleClassName)}>{title}</h2> : null }
        <div className="self-center">
            <div className="flex flex-row">
                {(Array.isArray(children) ? children : [children]).map((elem, index) => {
                    if (elem?.type == Field)
                        return createElement(elem.type, { horizontal, data, dataSetter, key: index, ...elem.props });
                    return elem;
                })}
            </div>
        </div>
    </div>
}

/**
 * 
 * @param {{ label?: string, children?: any, className?: string, horizontal?: boolean, htmlFor?: string, data?: any, dataSetter?: Function }}} param0 
 * @returns 
 */
export function Field({ label, children, className = '', horizontal = false, htmlFor = '', data = undefined, dataSetter = undefined }) {
    let childs = Array.isArray(children) ? children : [children];

    let setData = useCallback(/** @param {React.ChangeEvent<HTMLInputElement>} e */ e => {
        let target = e.currentTarget;
        let value = target.value;
        if (target.type == 'checkbox') {
            // @ts-ignore
            value = target.checked;
        }
        if (typeof data == 'object' && htmlFor) {
            data = { ...data, [htmlFor]: value };
        } else {
            data = value;
        }
        dataSetter?.call(this, data);
    }, [htmlFor, data, dataSetter]);

    childs = childs.map((child, index) => {
        if (typeof data != 'undefined' && dataSetter) {
            if (child?.type == 'input' || child?.type == 'select' || child?.type == 'textarea') {
                let valueProp = 'value';
                if (child.props.type == 'checkbox') valueProp = 'checked';
                return createElement(child.type, { key: index, onChange: setData, [valueProp]: (htmlFor && typeof data == 'object' ? data[htmlFor] : data) ?? '', ...child.props });
            }
        }
        return child;
    })

    return <div className={classNames("flex px-1", { 'flex-col': !horizontal, 'flex-row self-center': horizontal }, className)}>
        <label htmlFor={htmlFor} className={classNames(styles.label, { 'pr-3': horizontal })}>{label}</label>
        {childs}
    </div>;
}