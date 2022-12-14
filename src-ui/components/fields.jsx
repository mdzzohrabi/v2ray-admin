// @ts-check

import classNames from "classnames";
import React, { createContext, createElement, useCallback, useContext } from "react";
import { useArrayDelete, useArrayInsert, useArrayUpdate, useObjectCRUD } from "../lib/hooks";
import { styles } from "../lib/styles";

/**
 * @template T
 * @type {import("react").Context<{
 * 		horizontal?: boolean,
 * 		data?: T,
 * 		dataSetter?: (value: T) => any,
 * 		unsetEmpty?: boolean
 * }>}
 */
let FieldContext = createContext({});

/**
 * Fields group
 * @param {React.HTMLAttributes<HTMLDivElement> & { children?: any, title?: string, titleClassName?: string, horizontal?: boolean, data?: any, dataSetter?: (value: any) => any, layoutVertical?: boolean, unsetEmpty?: boolean, containerClassName?: string }} param0 
 * @returns 
 */
export function FieldsGroup({ title, children, className, titleClassName, horizontal = false, layoutVertical = false, data = undefined, dataSetter = undefined, unsetEmpty = true, containerClassName = '', ...props }) {

	let provider = <FieldContext.Provider value={{ horizontal, data, dataSetter, unsetEmpty }}>
		{children}
	</FieldContext.Provider>;

	if (!title && !className) {
		return provider;
	}
	
	return <div className={classNames("flex overflow-auto", className)} {...props}>
		{title ? <h2 className={classNames("font-bold px-3 py-3 whitespace-nowrap", titleClassName)}>{title}</h2> : null }
		<div className="self-center flex-1">
			<div className={classNames("flex flex-1", { "flex-row": !layoutVertical, 'flex-col': layoutVertical }, containerClassName)}>
				{provider}
			</div>
		</div>
	</div>
}

export function FieldObject({ children, path }) {
	let context = useContext(FieldContext);
	
	let setData = useCallback(data => {
		console.log(`Set Data`, data, context.data, path);
		if (context.dataSetter) {
			let obj = { ...context.data };
			if (!data && context.unsetEmpty) {
				delete obj[path];
			} else {
				obj[path] = data;
			}
			console.log(obj);
			// @ts-ignore
			context.dataSetter(obj);
		}
	}, [context.data, context.dataSetter]);

	let data = context.data && context.data[path] ? context.data[path] : {};

	return <FieldContext.Provider value={{ ...context, dataSetter: setData, data }}>{children}</FieldContext.Provider>;
}

/**
 * 
 * @param {{ label?: string, children?: any, className?: string, horizontal?: boolean, htmlFor?: string, data?: any, dataSetter?: Function, unsetEmpty?: boolean }} param0 
 * @returns 
 */
export function Field({ label, children, className = '', horizontal = undefined, htmlFor = '', data = undefined, dataSetter = undefined, unsetEmpty = undefined }) {
	let context = useContext(FieldContext);
	let childs = Array.isArray(children) ? children : [children];

	horizontal = horizontal ?? context.horizontal ?? false;
	data = data ?? context.data;
	dataSetter = dataSetter ?? context.dataSetter;
	unsetEmpty = unsetEmpty ?? context.unsetEmpty ?? true;

	let setData = useCallback(/** @param {React.ChangeEvent<HTMLInputElement>} e */ e => {
		let target = e.currentTarget;
		let value = target.value;
		if (target.type == 'checkbox') {
			// @ts-ignore
			value = target.checked;
		}

		if (target.type == 'number') {
			// @ts-ignore
			value = value ? Number(value) : value;
		}

		if (typeof data == 'object' && htmlFor) {
			if (!value && unsetEmpty) {
				data = {...data};
				delete data[htmlFor];
			}
			else {
				data = { ...data, [htmlFor]: value };
			}
		} else {
			data = value;
		}
		dataSetter?.call(this, data, htmlFor);
	}, [htmlFor, data, dataSetter]);

	childs = childs.map((child, index) => {
		if (dataSetter) {
			if (child?.type == 'input' || child?.type == 'select' || child?.type == 'textarea') {
				let valueProp = 'value';
				if (child.props.type == 'checkbox') valueProp = 'checked';
				return createElement(child.type, { key: index, onChange: setData, [valueProp]: (htmlFor && typeof data == 'object' ? data[htmlFor] : data) ?? '', ...child.props });
			}
		}
		return child;
	})

	return <div className={classNames("flex px-1", { 'flex-col': !horizontal, 'flex-row self-center': horizontal }, className)}>
		<label htmlFor={htmlFor} className={classNames(styles.label, { 'pr-3': horizontal }, 'whitespace-nowrap')}>{label}</label>
		{childs}
	</div>;
}

/**
 * Field Collection
 * @template T
 * @param {{
 * 		data: T[],
 * 		dataSetter: (value: T[]) => any,
 * 		children: (props: {
 * 			items: T[],
 * 			addItem: (_: any, item: T) => any,
 * 			deleteItem: (deletedItem: T) => any,
 * 			updateItem: (item: T, edited: T) => any
 * 		}) => any
 * }} param0
 */
export function Collection({ data, dataSetter, children }) {
	let addItem = useArrayInsert(data, dataSetter);
	let deleteItem = useArrayDelete(data, dataSetter);
	let updateItem = useArrayUpdate(data, dataSetter);

	return children({ items: data, addItem, deleteItem, updateItem });
}


/**
 * Field Collection
 * @template T
 * @param {{
 * 		path?: string
 * 		data?: T,
 * 		dataSetter?: (value: T) => any,
 * 		children: (props: {
 * 			value: T | null,
 * 			deleteKey: (key: any) => any,
 * 			setKey: (key: any, value: any) => any,
 * 			renameKey: (key: any, newKey: any) => any,
 * 		}) => any
 * }} param0
 */
export function ObjectCollection({ data, dataSetter, children, path }) {
	let context = useContext(FieldContext);

	if (path) {
		// @ts-ignore
		if (!data) data = context.data ?? {};
	}

	let memoDataSetter = useCallback(newData => {
		if (!dataSetter && path && context.dataSetter) {
			context.dataSetter(newData);
		} else if (dataSetter) {
			dataSetter(newData);
		}
	}, [dataSetter, context.dataSetter, data]);

	let crud = useObjectCRUD(data, memoDataSetter);

	return children(crud);
}