import { Popup } from '@common/components/popup';
import { useOutsideAlerter } from '@common/lib/hooks';
import { ArrowRightOnRectangleIcon, ArrowsRightLeftIcon, BriefcaseIcon, ChartPieIcon, CircleStackIcon, CloudIcon, Cog6ToothIcon, ComputerDesktopIcon, CurrencyDollarIcon, HomeIcon, ServerIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { ServerNode } from '../../../types';
import { useUser } from '../lib/hooks';
import { serverRequest } from '../lib/util';
import { AppContext } from './app-context';

interface ContainerProps {
    block?: boolean
    children?: any
    pageTitle?: string
}

export function Container({ children, block = true, pageTitle }: ContainerProps) {
    const router = useRouter();
    const { server, setServer } = useContext(AppContext);

    let {mutate: refreshNodes, data: nodes, isValidating: isLoading} = useSWR<ServerNode[]>('/nodes?_main=1', serverRequest.bind(this, { ...server, node: undefined }), {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false
    });

    const {access, user} = useUser();

    const menu = useMemo(() => {
        return [
            { show: access('home', 'show'), text: 'Home', link: '/home', admin: false, icon: <HomeIcon className='w-4'/> },
            { show: access('logs', 'list'), text: 'Logs', link: '/logs', admin: true, icon: <ComputerDesktopIcon className='w-4'/> },
            { show: access('serverNodes', 'list'), text: 'Server Nodes', link: '/nodes', admin: true, icon: <CloudIcon className='w-4'/> },
            { show: access('trafficUsage', 'list'), text: 'Traffic Usage', link: '/usages/traffic', admin: true, icon: <ChartPieIcon className='w-4'/> },
            { show: access('transactions', 'list'), text: 'Billing', link: '/transactions', admin: false, icon: <CurrencyDollarIcon className='w-4'/> },
            { show: access('administrators'), text: 'Admins', link: '/system/admins', admin: false, icon: <UsersIcon className='w-4'/> },
            { show: access('users', 'list'), text: 'Clients', link: '/users', admin: false, icon: <UserGroupIcon className='w-4'/> },
            { show: access('config', 'list'), text: 'Config', link: '/configuration', admin: true, icon: <Cog6ToothIcon className='w-4'/> },
            { show: true, text: 'Logout', link: '/logout', admin: false, icon: <ArrowRightOnRectangleIcon className='w-4'/> },
        ]
    }, [access]);

    const onChangeNode = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setServer({
            ...server,
            node: e.target.value
        });
    }, [server]);

    const onMenuClick = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        router.push(e.target.value);
    }, [router]);

    const [showServerPopup, setShowServerPopup] = useState(false);
    const refServerPopup = useRef();
    
    useOutsideAlerter(refServerPopup, () => setShowServerPopup(false));

    return <>
    {pageTitle?<Head><title>{pageTitle}</title></Head>:null}
    <div className="flex flex-col h-screen overflow-x-auto w-full text-xs xl:text-sm">
        <div className="flex flex-row items-center">
            <div className="flex flex-row items-center space-x-2 px-4 border-r-[1px] border-r-slate-400">
                <BriefcaseIcon className='w-8 text-amber-500 bg-white rounded-full p-1'/>
                <span className="self-center font-light text-lg select-none hidden md:inline-block">Management</span>
            </div>
            <select onChange={onMenuClick} className='flex-1 bg-slate-200 font-bold px-2 py-3 my-2 mx-3 lg:hidden rounded-md' value={router.pathname}>
                {menu.filter(x => x.show).map(x => <option key={x.link} value={x.link}>{x.text}</option>)}
            </select>
            <ul className="px-2 py-3 hidden lg:flex flex-row xl:sticky top-0 z-50 bg-slate-100 flex-1 self-center">
                {menu.map(x => x.show ? <MenuLink key={x.link} href={x.link} icon={x.icon} text={x.text}/> : null)}
            </ul>
            <div className='relative max-sm:mr-4'>
                <ServerIcon onClick={() => setShowServerPopup(!showServerPopup)} className='sm:hidden w-9 text-slate-500 bg-white rounded-full p-1 shadow-md'/>
                <div ref={refServerPopup} className={classNames('select-none flex rounded-md', {
                    // Small Screen (Show)
                    'max-sm:absolute max-sm:right-0 max-sm:block max-sm:flex-col max-sm:bg-white max-sm:shadow-lg': showServerPopup,
                    // Small Screen (Hidden)
                    'max-sm:hidden': !showServerPopup,
                    // Large Screen
                    'sm:border-[1px] sm:flex-row sm:border-slate-300 sm:text-gray-400 sm:m-2': true,
                })}>
                    <div className="self-center px-3 py-1 flex flex-col">
                        <div className="flex flex-row gap-x-2 items-center">
                            <ServerIcon className='w-4'/>
                            <span className="font-bold">Server</span>
                            <button onClick={() => router.push('/server_config')} className={'text-xs flex flex-row gap-x-2 hover:border-slate-600 duration-200 hover:text-slate-600 ease-in-out border-[1px] px-2 rounded-xl items-center'}>
                                <ArrowsRightLeftIcon className='w-3'/>
                                Change
                            </button>
                        </div>
                        <div className="flex flex-row">
                            <Popup popup={server?.url}>
                                {server?.name ?? server?.url} ({user?.username})
                            </Popup>
                        </div>
                    </div>
                    {access('serverNodes', 'list') ? 
                    <div className="self-center px-3 py-1 flex flex-col max-sm:border-t-2 sm:border-l-[1px] border-l-slate-300">
                        <div className="flex flex-row gap-x-2">
                            <CircleStackIcon className='w-4'/>
                            <span className="font-bold">Node</span>
                        </div>
                        <select className={'bg-transparent'} value={server?.node} onChange={onChangeNode}>
                            <option value="">(main)</option>
                            {nodes?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                    </div> : null }
                </div>
            </div>
        </div>
        {block ?
        <div className="bg-white block shadow-md mt-2 min-w-fit">
            {children}
        </div> : children}
    </div></>
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