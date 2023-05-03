import { useCallback, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR, { Fetcher, SWRConfiguration } from "swr";
import { AppContext } from "../components/app-context";
import { serverRequest } from "./util";

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

interface CRUDOptions<T> {
	onDone?: (item: T, action: 'add' | 'edit' | 'delete') => any
	onError?: (item: T, action: 'add' | 'edit' | 'delete') => any
	insertMessage?: string
	removeMessage?: string
	editMessage?: string
	insertUrl?: string
	removeUrl?: string
	editUrl?: string
	listUrl?: string
}

export function useCRUD<T>(url: string, { onDone, insertMessage, removeMessage, editMessage, removeUrl, editUrl, insertUrl, onError, listUrl }: CRUDOptions<T> = {}) {
	const {server} = useContext(AppContext);
	const [isLoading, setLoading] = useState(false);
	const {data: items, isValidating: isItemsLoading, mutate: refreshItems, error: itemsError} = useContextSWR<T[]>(listUrl ?? url, null, {});

	const insert = useCallback(async (item : T) => {
        try {
			setLoading(true);
            let result = await serverRequest(server, insertUrl ?? ('POST:' + url), {
                ...item
            });

			if (result?.ok) {
				toast.success(result?.message ?? insertMessage ?? `Item added successfull`);
				onDone?.call(this, item, 'add');
				refreshItems();
				return true;
			}
			else {
				onError?.call(this, item, 'add');
				toast.error(result?.error ?? 'Error');
				return false;
			}
        }
        catch (err) {
			onError?.call(this, item, 'add');
            toast.error(err?.message);
			return false;
        }
		finally {
			setLoading(false);
		}
    }, [onDone, server, insertMessage, insertUrl, refreshItems, onError]);

    const remove = useCallback(async (item: T) => {
		try {
			setLoading(true);
			let result = await serverRequest(server, removeUrl ?? ('DELETE:' + url), item);
			if (result?.ok) {
				toast.success(result?.message ?? removeMessage ?? `Item removed successful`)
				onDone?.call(this, item, 'remove');
				refreshItems();
				return true;
			} else {
				onError?.call(this, item, 'remove');
				toast.error(result?.error ?? 'Error');
				return false;
			}
		}
		catch (err) {
			onError?.call(this, item, 'remove');
			toast.error(err?.message);
			return false;
		}
		finally {
			setLoading(false);
		}
    }, [onDone, server, removeMessage, removeUrl, refreshItems]);

    const edit = useCallback(async (item: T) => {
		try {
			setLoading(true);
			let result = await serverRequest(server, editUrl ?? ('PUT:' + url), item);
			if (result?.ok) {
				toast.success(result?.message ?? editMessage ?? `Item edited successful`);
				onDone?.call(this, item, 'edit');
				refreshItems();
				return true;
			}
			else {
				onError?.call(this, item, 'edit');
				toast.error(result?.error ?? 'Error');
				return false;
			};
		}
		catch (err) {
			onError?.call(this, item, 'remove');
			toast.error(err?.message);
			return false;
		}
		finally {
			setLoading(false);
		}
    }, [onDone, server, editMessage, editUrl, refreshItems]);

	const patch = useCallback(async (item: T, field: string, value: any) => {
		try {
			setLoading(true);
			let result = await serverRequest(server, editUrl ?? ('PUT:' + url), { item, field, value });
			if (result?.ok) {
				toast.success(result?.message ?? editMessage ?? `Item edited successful`);
				onDone?.call(this, item, 'edit');
				refreshItems();
				return true;
			}
			else {
				onError?.call(this, item, 'edit');
				toast.error(result?.error ?? 'Error');
				return false;
			}
		}
		catch (err) {
			onError?.call(this, item, 'remove')
			toast.error(err?.message);
			return false;
		}
		finally {
			setLoading(false);
		}
    }, [onDone, server, editMessage, editUrl, refreshItems]);

	return { insert, remove, edit, patch, isLoading, items, isItemsLoading, refreshItems, itemsError };
}


export function useUser() {
	let {server} = useContext(AppContext);
	let { data, isValidating, mutate, error } = useSWR<{ ok: boolean, user?: SystemUser }>('/authenticate', serverRequest.bind(this, { ...server, node: undefined }));
	let { ok, user } = data ?? {};

	let access = useCallback(function <T extends keyof SystemAcls>(acl: T, subAcl?: keyof SystemAcls[T]): boolean {
		if (user?.acls?.isAdmin) return true;
		if (!user?.acls) return false;
		if (!user?.acls[acl]) return false;
		if (subAcl && !user?.acls[acl][subAcl]) return false;
		return true;
	}, [user]);

	return { ok, user, access, isValidating, mutate, error }
}