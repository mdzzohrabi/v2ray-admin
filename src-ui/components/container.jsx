// @ts-check
import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { serverRequest } from '../lib/util';
import { AppContext } from './app-context';
import { HomeIcon, CurrencyDollarIcon, UsersIcon, ServerIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, ChartPieIcon, CloudIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export function Container({ children, block = true }) {
    const router = useRouter();
    const isFull = router.query.all == '1';
    const { server, setServer } = useContext(AppContext);

    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {mutate: refreshNodes, data: nodes, isValidating: isLoading} = useSWR('/nodes?_main=1', serverRequest.bind(this, { ...server, node: undefined }), {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false
    });

    const menu = useMemo(() => {
        return [
            { text: 'Home', link: '/home', admin: false, icon: <HomeIcon className='w-4'/> },
            { text: 'Logs', link: '/logs', admin: true, icon: <ComputerDesktopIcon className='w-4'/> },
            { text: 'Server Nodes', link: '/nodes', admin: true, icon: <CloudIcon className='w-4'/> },
            { text: 'Traffic Usage', link: '/usages/traffic', admin: true, icon: <ChartPieIcon className='w-4'/> },
            { text: 'Transactions', link: '/transactions', admin: false, icon: <CurrencyDollarIcon className='w-4'/> },
            { text: 'Users', link: '/users', admin: false, icon: <UsersIcon className='w-4'/> },
            { text: 'Config', link: '/configuration', admin: true, icon: <Cog6ToothIcon className='w-4'/> },
            { text: 'Servers', link: '/server_config', admin: false, icon: <ServerIcon className='w-4'/> },
            { text: 'Logout', link: '/logout', admin: false, icon: <ArrowRightOnRectangleIcon className='w-4'/> },
        ]
    }, []);

    const onChangeNode = useCallback((/** @type {import('react').ChangeEvent<HTMLSelectElement>} */ e) => {
        setServer({
            ...server,
            node: e.target.value
        });
    }, []);

    const onMenuClick = useCallback((/** @type {import('react').ChangeEvent<HTMLSelectElement>} */ e) => {
        router.push(e.target.value + (isFull ? '?all=1' : ''));
    }, [isFull, router]);

    return <div className="flex flex-col h-screen overflow-x-auto w-full text-xs xl:text-sm">
        <div className="flex flex-row items-center">
            <span className="self-center font-light px-4 text-lg select-none border-r-[1px] border-r-slate-400 hidden md:inline-block">Management</span>
            <select onChange={onMenuClick} className='flex-1 bg-slate-200 font-bold px-2 py-3 my-2 mx-3 lg:hidden rounded-md' value={router.pathname}>
                {menu.filter(x => !x.admin || isFull).map(x => <option key={x.link} value={x.link}>{x.text}</option>)}
            </select>
            <ul className="px-2 py-3 hidden lg:flex flex-row xl:sticky top-0 z-50 bg-slate-100 flex-1 self-center">
                {menu.map(x => !x.admin || isFull ? <MenuLink href={x.link + (isFull ? '?all=1' : '')} icon={x.icon} text={x.text}/> : null)}
            </ul>
            <div className="self-center px-3 text-gray-400 flex flex-col">
                <span className="font-bold">Server</span>
                <div className="flex flex-row">
                    <span>{server?.url}</span>{server?.name ? <span className="ml-2">({server?.name})</span> : null}
                </div>
            </div>
            {isFull ? 
            <div className="self-center px-3 py-1 mx-2 my-2 text-gray-400 border-gray-400 flex flex-col rounded-md border-[1px]">
                <span className="font-bold px-1">Node</span>
                <select className='bg-transparent' value={server?.node} onChange={onChangeNode}>
                    <option value="">(main)</option>
                    {nodes?.map(x => <option value={x.id}>{x.name}</option>)}
                </select>
            </div> : null }
        </div>
        {block ?
        <div className="bg-white block shadow-md mt-2 min-w-fit">
            {children}
        </div> : children}
    </div>
}

/**
 * 
 * @param {{ children?: any, text?: string, icon?: any, href: string }} param0 
 * @returns 
 */
function MenuLink({ href, text = undefined, icon = undefined, children = undefined }) {
    const router = useRouter();
    return <Link href={href}>
        <li className={classNames('flex flex-row gap-x-2 items-center whitespace-nowrap px-3 py-1 cursor-pointer rounded-lg', { 'hover:bg-white': router.asPath != href }, { 'font-bold bg-slate-800 text-white': router.asPath == href })}>{icon}{text ?? children}</li>
    </Link>;
}