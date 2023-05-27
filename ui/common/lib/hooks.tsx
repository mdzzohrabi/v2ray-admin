import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { toast as Toaster } from 'react-hot-toast';
import { deepCopy, store, stored } from "./util";

export let toast: typeof Toaster;

export function setToast(_toast: typeof Toaster) {
	toast = _toast;
}

export function getToast() {
	return toast;
}

export function useOutsideAlerter(ref, callback) {
	useEffect(() => {
	  /**
	   * Alert if clicked on outside of element
	   */
	  function handleClickOutside(event) {
		if (ref.current && !ref.current.contains(event.target)) {
		  callback();
		}
	  }
	  // Bind the event listener
	  document.addEventListener("mousedown", handleClickOutside);
	  return () => {
		// Unbind the event listener on clean up
		document.removeEventListener("mousedown", handleClickOutside);
	  };
	}, [ref, callback]);
}

export function usePrompt() {
  return useCallback((message: any, okButton: any, onClick: Function) => {
	  let clicked = false;
	  toast.custom(t => {
		  return <div className={"ring-1 ring-black ring-opacity-20 whitespace-nowrap text-sm shadow-lg bg-white flex rounded-lg pointer-events-auto px-3 py-2"}>
			  <span className="flex-1 self-center mr-3">{message}</span>

			  <button className="rounded-lg duration-150 hover:shadow-md bg-slate-100 px-2 py-1 ml-1" onClick={() => toast.remove(t.id)}>Cancel</button>
			  <button className="rounded-lg duration-150 hover:shadow-md bg-blue-400 text-white px-2 py-1 ml-1 hover:bg-blue-600" onClick={() => { toast.remove(t.id); if (!clicked) onClick(); clicked = true;}}>{okButton}</button>
		  </div>
	  }, { position: 'top-center' })
  }, []);
}

export function useArrayDelete<T>(arr: T[], setter: ((value: T[]) => any)) {
  return useCallback((/** @type {T} */ deletedItem) => {
	setter(arr.filter(x => x != deletedItem));
  }, [arr, setter]);
}

export function useArrayInsert<T>(arr: T[], setter: ((value: T[]) => any)) {
  return useCallback((_, /** @type {T} */ newItem) => {
	setter([ ...arr, newItem ]);
  }, [arr, setter]);
}

export function useArrayUpdate<T>(arr: T[], setter: ((value: T[]) => any)) {
  return useCallback((/** @type {T} */ item, /** @type {T} */ edit) => {
	let index = arr.indexOf(item);
	if (index >= 0)
	  arr[index] = edit;
	setter([ ...arr ]);
  }, [arr, setter]);
}

/**
 * @template T
 * @param {T?} initValue Object value
 * @param {((value: T) => any)?} setter Setter function
 */
export function useObjectCRUD<T>(initValue?: T, setter?: ((value: T) => any)) {

	if (!initValue)
		initValue = {} as T;

	let [value, setValue] = useState<T>(initValue);

	useEffect(() => {
		setValue(initValue as T);
	}, [initValue]);

	let deleteKey = useCallback((key) => {
		let newValue = deepCopy(value);
		if (newValue) delete newValue[key];
		setter?.call(this, newValue);
		setValue(newValue);
	}, [value, setter]);

	let setKey = useCallback((key, keyValue) => {
		let newValue = deepCopy(value);
		if (newValue) newValue[key] = keyValue;
		setter?.call(this, newValue);
		setValue(newValue);
	}, [value, setter]);

	let renameKey = useCallback((key, newKey) => {
		let newValue = deepCopy(value);
		if (newValue) {
			newValue[newKey] = newValue[key];
			delete newValue[key];
		}
		setter?.call(this, newValue);
		setValue(newValue);
	}, [value, setter]);

	return { value, deleteKey, setKey, renameKey };
}

export function checkReact(_source) {
	console.log(_source == React);
}

export function useStoredState<T>(key: string, init: T): [T, Dispatch<SetStateAction<T>>, boolean] {
	const [state, setState] = React.useState<T>(init);
	const [loaded, setLoaded] = React.useState(false);
	const firstRun = useRef(true);

	useEffect(() => {
		setState(stored(key) ?? init);
		setLoaded(true);
	}, [key]);

	// Change effect
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			return;
		}
		store(key, state);
	}, [state]);

	return [state, setState, loaded];
}

export function usePropState<T>(prop: T) {
	let state = useState(prop);
	useEffect(() => state[1](prop), [prop]);
	return state;
}

let counterKeys: { [name: string]: number } = {};

export function clearCounter() {
	counterKeys = {};
}

export function useCounter(key: string) {
	return useMemo(() => {
		if (typeof counterKeys[key] == 'undefined')
			counterKeys[key] = 0;
		return counterKeys[key]++;
	}, [key]);
}

export function useAwareState<T>(init: T, deps: any[]) {
	let state = useState(init);
	let firstLoad = useRef(true);
	useEffect(() => {
		if (firstLoad.current) {
			firstLoad.current = false;
			return;
		}
		state[1](init);
	}, deps);
	return state;
}