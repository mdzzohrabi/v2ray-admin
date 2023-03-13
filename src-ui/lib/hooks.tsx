// @ts-check

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR, { Fetcher, SWRConfiguration } from "swr";
import { AppContext } from "../components/app-context";
import { deepCopy, serverRequest, store, stored } from "./util";

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
  return useCallback((message, okButton, onClick) => {
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

/**
 * @template T
 * @param {T[]} arr 
 * @param {(value: T[]) => any} setter 
 * @returns 
 */
export function useArrayDelete(arr, setter) {
  return useCallback((/** @type {T} */ deletedItem) => {
	setter(arr.filter(x => x != deletedItem));
  }, [arr, setter]);
}

/**
 * @template T
 * @param {T[]} arr 
 * @param {(value: T[]) => any} setter 
 * @returns 
 */
export function useArrayInsert(arr, setter) {
  return useCallback((_, /** @type {T} */ newItem) => {
	setter([ ...arr, newItem ]);
  }, [arr, setter]);
}

/**
 * @template T
 * @param {T[]} arr 
 * @param {(value: T[]) => any} setter 
 * @returns 
 */
export function useArrayUpdate(arr, setter) {
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
export function useObjectCRUD(initValue = null, setter = null) {

	/** @ts-ignore */
	if (!initValue) initValue = {};

	let [value, setValue] = useState(initValue);

	useEffect(() => {
		setValue(initValue);
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


/**
 * @template T
 * @param {string} key Storage key
 * @param {T} init Value
 * @returns {[ T, React.Dispatch<React.SetStateAction<T>> ]}
 */
export function useStoredState(key, init) {
	let state = useState(stored(key) ?? init);
	useEffect(() => store(key, state[0]), [state[0]]);
	// @ts-ignore
	return state;
}

export function useContextSWR<T = any>(key: any, body: any = undefined, config: SWRConfiguration<T, any, Fetcher<T, any>> = undefined) {
	let context = useContext(AppContext);
	let [cacheKey, setCacheKey] = useState('');
	
	let requester = useMemo(() => {
		setCacheKey(btoa(JSON.stringify(context.server)));
		return serverRequest.bind(this, context.server);
	}, [context]);

	if (typeof key == 'string') {
		if (key.includes('?'))
			key += '&_c=' + cacheKey;
		else
			key += '?_c=' + cacheKey;


		if (!!body)
			key = { url: key, body };
	}
	else if (typeof key == 'object' && 'url' in key) {
		if (key.url.includes('?'))
			key.url += '&_c=' + cacheKey;
		else
			key.url += '?_c=' + cacheKey;

		if (!!body)
			key.body = body;
	}

	return useSWR<T>(key, requester, config);
}