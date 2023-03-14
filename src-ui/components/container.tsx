import { ArrowRightOnRectangleIcon, ArrowsRightLeftIcon, BriefcaseIcon, ChartPieIcon, CircleStackIcon, CloudIcon, Cog6ToothIcon, ComputerDesktopIcon, CurrencyDollarIcon, HomeIcon, ServerIcon, UsersIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { queryString, serverRequest } from '../lib/util';
import { AppContext } from './app-context';
import { Popup } from './popup';

export function Container({ children, block = true }) {
    const router = useRouter();
    const isFull = router.query.all == '1';
    const { server, setServer } = useContext(AppContext);

    let {mutate: refreshNodes, data: nodes, isValidating: isLoading} = useSWR<ServerNode[]>('/nodes?_main=1', serverRequest.bind(this, { ...server, node: undefined }), {
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
            // { text: 'Servers', link: '/server_config', admin: false, icon: <ServerIcon className='w-4'/> },
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
            <div className="flex flex-row items-center space-x-2 px-4 border-r-[1px] border-r-slate-400">
                <BriefcaseIcon className='w-8 text-amber-500 bg-white rounded-full p-1'/>
                <span className="self-center font-light text-lg select-none hidden md:inline-block">Management</span>
            </div>
            <select onChange={onMenuClick} className='flex-1 bg-slate-200 font-bold px-2 py-3 my-2 mx-3 lg:hidden rounded-md' value={router.pathname}>
                {menu.filter(x => !x.admin || isFull).map(x => <option key={x.link} value={x.link}>{x.text}</option>)}
            </select>
            <ul className="px-2 py-3 hidden lg:flex flex-row xl:sticky top-0 z-50 bg-slate-100 flex-1 self-center">
                {menu.map(x => !x.admin || isFull ? <MenuLink href={x.link + (isFull ? '?all=1' : '')} icon={x.icon} text={x.text}/> : null)}
            </ul>
            <div className='flex select-none flex-row border-[1px] rounded-md border-slate-300 m-2 text-gray-400'>
                <div className="self-center px-3 py-1 flex flex-col">
                    <div className="flex flex-row gap-x-2 items-center">
                        <ServerIcon className='w-4'/>
                        <span className="font-bold">Server</span>
                        <button onClick={() => router.push('/server_config' + queryString({ all: isFull ? '1' : undefined }))} className={'text-xs flex flex-row gap-x-2 hover:border-slate-600 duration-200 hover:text-slate-600 ease-in-out border-[1px] px-2 rounded-xl items-center'}>
                            <ArrowsRightLeftIcon className='w-3'/>
                            Change
                        </button>
                    </div>
                    <div className="flex flex-row">
                        <Popup popup={server?.url}>
                            {server?.name ?? server?.url}
                        </Popup>
                    </div>
                </div>
                {isFull ? 
                <div className="self-center px-3 py-1 flex flex-col border-l-[1px] border-l-slate-300">
                    <div className="flex flex-row gap-x-2">
                        <CircleStackIcon className='w-4'/>
                        <span className="font-bold">Node</span>
                    </div>
                    <select className={'bg-transparent'} value={server?.node} onChange={onChangeNode}>
                        <option value="">(main)</option>
                        {nodes?.map(x => <option value={x.id}>{x.name}</option>)}
                    </select>
                </div> : null }
            </div>
        </div>
        {block ?
        <div className="bg-white block shadow-md mt-2 min-w-fit">
            {children}
        </div> : children}
    </div>
}

interface MenuLinkProps {
    children?: any, text?: string, icon?: any, href: string
}

function MenuLink({ href, text = undefined, icon = undefined, children = undefined }: MenuLinkProps) {
    const router = useRouter();
    return <Link href={href}>
        <li className={classNames('flex flex-row gap-x-2 items-center whitespace-nowrap px-3 py-1 cursor-pointer rounded-lg', { 'hover:bg-white': router.asPath != href }, { 'font-bold bg-slate-800 text-white': router.asPath == href })}>{icon}{text ?? children}</li>
    </Link>;
}