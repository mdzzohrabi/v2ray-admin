// @ts-check

import classNames from "classnames";
import React, { createContext } from "react";
import { useContext } from "react";
import { useCallback } from "react";
import { createElement } from "react";
import { styles } from "../styles";

/**
 * @template T
 * @type {import("react").Context<{
 * 		horizontal?: boolean,
 * 		data?: T,
 * 		dataSetter?: (value: T) => any
 * }>}
 */
let FieldContext = createContext({});

/**
 * Fields group
 * @param {React.HTMLAttributes<HTMLDivElement> & { children?: any, title?: string, titleClassName?: string, horizontal?: boolean, data?: any, dataSetter?: (value: any) => any, layoutVertical?: boolean }} param0 
 * @returns 
 */
export function FieldsGroup({ title, children, className, titleClassName, horizontal = false, layoutVertical = false, data = undefined, dataSetter = undefined, ...props }) {

	let provider = <FieldContext.Provider value={{ horizontal, data, dataSetter }}>
		{children}
	</FieldContext.Provider>;

	if (!title && !className) {
		return provider;
	}
	
	return <div className={classNames("flex text-sm overflow-auto", className)} {...props}>
		{title ? <h2 className={classNames("font-bold px-3 py-3 whitespace-nowrap", titleClassName)}>{title}</h2> : null }
		<div className="self-center flex-1">
			<div className={classNames("flex flex-1", { "flex-row": !layoutVertical, 'flex-col': layoutVertical })}>
				{provider}
			</div>
		</div>
	</div>
}

/**
 * 
 * @param {{ label?: string, children?: any, className?: string, horizontal?: boolean, htmlFor?: string, data?: any, dataSetter?: Function }} param0 
 * @returns 
 */
export function Field({ label, children, className = '', horizontal = undefined, htmlFor = '', data = undefined, dataSetter = undefined }) {
	let context = useContext(FieldContext);
	let childs = Array.isArray(children) ? children : [children];

	horizontal = horizontal ?? context.horizontal ?? false;
	data = data ?? context.data;
	dataSetter = dataSetter ?? context.dataSetter;

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
		dataSetter?.call(this, data, htmlFor);
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