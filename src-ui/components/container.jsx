// @ts-check
import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import React from 'react';
import { useContext } from 'react';
import { AppContext } from './app-context';
import { x64 } from 'crypto-js';

export function Container({ children }) {
    const router = useRouter();
    const isFull = router.query.all == '1';
    const { server } = useContext(AppContext);

    return <div className="flex flex-col h-screen overflow-x-auto w-full text-xs xl:text-sm">
        <div className="flex flex-row">
            <span className="self-center font-light px-4 text-lg select-none border-r-[1px] border-r-slate-400">Management</span>
            <ul className="px-2 py-3 flex xl:sticky top-0 z-50 bg-slate-100 flex-1 self-center">
                {isFull ? <MenuLink href={"/logs" + (isFull ? '?all=1' : '')} text={"Logs"}/> : null}
                {isFull ? <MenuLink href={"/usages/traffic" + (isFull ? '?all=1' : '')} text={"Traffic Usages"}/> : null}
                <MenuLink href={"/transactions" + (isFull ? '?all=1' : '')} text={"Transactions"}/>
                <MenuLink href={"/users" + (isFull ? '?all=1' : '')} text={"Users"}/>
                {isFull?<MenuLink href={"/configuration" + (isFull ? '?all=1' : '')} text={"Configuration"}/>:null}
                <MenuLink href={"/server_config" + (isFull ? '?all=1' : '')} text={"Servers"}/>
                <MenuLink href={"/logout"}>Logout</MenuLink>
            </ul>
            <span className="self-center px-3 text-gray-400 flex flex-col">
                <span className="font-bold">Server</span>
                <div className="flex flex-row">
                    <span>{server?.url}</span>{server?.name ? <span className="ml-2">({server?.name})</span> : null}
                </div>
            </span>
        </div>
        <div className="bg-white block shadow-md mt-2 min-w-fit">
            {children}
        </div>
    </div>
}

/**
 * 
 * @param {{ children?: any, text?: string, href: string }} param0 
 * @returns 
 */
function MenuLink({ href, text = undefined, children = undefined }) {
    const router = useRouter();
    return <Link href={href}>
        <li className={classNames('whitespace-nowrap px-3 py-1 cursor-pointer rounded-lg', { 'hover:bg-white': router.asPath != href }, { 'font-bold bg-slate-800 text-white': router.asPath == href })}>{text ?? children}</li>
    </Link>;
}