import classNames from "classnames";
import React, { ChangeEvent, createContext, createElement, useCallback, useContext } from "react";
import { useArrayDelete, useArrayInsert, useArrayUpdate, useCounter, useObjectCRUD } from "../lib/hooks";
import { styles } from "../lib/styles";
import { MultiSelect } from "./multi-select";
import { Select } from "./select";

export interface FieldContext<T> {
	horizontal?: boolean,
	data?: T,
	dataSetter?: (value: T) => any,
	unsetEmpty?: boolean
}

export interface FieldsGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	children?: any;
	title?: any;
	titleClassName?: string;
	horizontal?: boolean;
	data?: any;
	dataSetter?: (value: any) => any;
	layoutVertical?: boolean;
	unsetEmpty?: boolean;
	containerClassName?: string;
}

let FieldContext = createContext<FieldContext<any>>({});

/**
 * Fields group
 */
export function FieldsGroup({ title, children, className, titleClassName, horizontal = false, layoutVertical = false, data = undefined, dataSetter = undefined, unsetEmpty = true, containerClassName = '', ...props }: FieldsGroupProps) {

	let provider = <FieldContext.Provider value={{ horizontal, data, dataSetter, unsetEmpty }}>
		{children}
	</FieldContext.Provider>;

	if (!title && !className) {
		return provider;
	}
	
	return <div className={classNames("flex", className)} {...props}>
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
		if (context.dataSetter) {
			let obj = { ...context.data };
			if (!data && context.unsetEmpty) {
				delete obj[path];
			} else {
				obj[path] = data;
			}
			context.dataSetter(obj);
		}
	}, [context.data, context.dataSetter]);

	let data = context.data && context.data[path] ? context.data[path] : {};

	return <FieldContext.Provider value={{ ...context, dataSetter: setData, data }}>{children}</FieldContext.Provider>;
}

export interface FieldProps {
	label?: string;
	children?: any;
	className?: string;
	horizontal?: boolean;
	htmlFor?: string;
	data?: any;
	dataSetter?: Function;
	unsetEmpty?: boolean;
	hint?: any
}

export function Field({ label, children, className = '', horizontal = undefined, htmlFor = '', data = undefined, dataSetter = undefined, unsetEmpty = undefined, hint }: FieldProps) {
	let context = useContext(FieldContext);
	let childs = Array.isArray(children) ? children : [children];

	horizontal = horizontal ?? context.horizontal ?? false;
	data = data ?? context.data;
	dataSetter = dataSetter ?? context.dataSetter;
	unsetEmpty = unsetEmpty ?? context.unsetEmpty ?? true;

	let uniqueIdPostfix = useCounter(htmlFor);

	let setData = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		let target = e.currentTarget;
		let value: any = target.value;
		
		if (target.tagName?.toLowerCase() == 'select' && target.multiple) {
			let selectedValues = [...target.querySelectorAll('option')].filter(x => x.selected).map(x => x.value);
			value = selectedValues;
		}
		else if (target.type == 'checkbox') {
			value = target.checked;
		}
		else if (target.type == 'number') {
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
			if (child?.type == MultiSelect || child?.type == Select || child?.type == 'input' || child?.type == 'select' || child?.type == 'textarea') {

				let valueProp = 'value';
				if (child.props.type == 'checkbox') valueProp = 'checked';

				let value = data ?? '';

				if (htmlFor && typeof value == 'object') {
					value = value[htmlFor];
				}
				
				// Mutiple array
				if (child?.type == 'select' && child?.props?.multiple) {
					value = !value ? [] : Array.isArray(value) ? value : [value];
				}

				return createElement(child.type, {
					key: index,
					onChange: setData,
					[valueProp]: value,
					...child.props,
					id: child.props?.id + '_' + uniqueIdPostfix
				});
			}
		}
		return child;
	})

	return <div className={classNames(className ,'px-1')}>
		<div className={classNames("flex", { 'flex-col': !horizontal, 'flex-row self-center items-center': horizontal })}>
			{label ? <label htmlFor={htmlFor + '_' + uniqueIdPostfix} className={classNames(styles.label, { 'pr-3': horizontal }, 'whitespace-nowrap')}>{label}</label> : null}
			{childs}
		</div>
		{ hint ? <div className="text-xs text-gray-500 whitespace-pre-wrap">{hint}</div> : null }
	</div>;
}

interface CollectionProps<T> {
	data: T[],
	dataSetter: (value: T[]) => any,
	children: (props: {
		items: T[],
		addItem: (_: any, item: T) => any,
		deleteItem: (deletedItem: T) => any,
		updateItem: (item: T, edited: T) => any
		dataSetter?: (value: T[]) => any
	}) => any	
}

/**
 * Field Collection
 */
export function Collection<T>({ data, dataSetter, children }: CollectionProps<T>) {
	let addItem = useArrayInsert(data, dataSetter);
	let deleteItem = useArrayDelete(data, dataSetter);
	let updateItem = useArrayUpdate(data, dataSetter);

	return children({ items: data, addItem, deleteItem, updateItem, dataSetter });
}

interface ObjectCollectionProps<T> {
	path?: string
	data?: T,
	dataSetter?: (value: T) => any,
	children: (props: {
		value: T | null,
		deleteKey: (key: any) => any,
		setKey: (key: any, value: any) => any,
		renameKey: (key: any, newKey: any) => any,
	}) => any
}

/**
 * Field Collection
 */
export function ObjectCollection<T>({ data, dataSetter, children, path }: ObjectCollectionProps<T>) {
	let context = useContext(FieldContext);

	if (path) {
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