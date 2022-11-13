// @ts-check
import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import React from 'react';

export function Container({ children }) {
    const router = useRouter();
    const isFull = router.query.all == '1';
    return <div className="flex flex-col h-screen overflow-x-auto w-full">
        <ul className="px-2 py-3 flex xl:sticky top-0 z-50 bg-slate-100">
            {isFull ? <MenuLink href={"/logs" + (isFull ? '?all=1' : '')} text={"Logs"}/> : null}
            <MenuLink href={"/transactions" + (isFull ? '?all=1' : '')} text={"Transactions"}/>
            <MenuLink href={"/users" + (isFull ? '?all=1' : '')} text={"Users"}/>
            <MenuLink href={"/server_config" + (isFull ? '?all=1' : '')} text={"Server Config"}/>
            <MenuLink href={"/logout"}>Logout</MenuLink>
        </ul>
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
        <li className={classNames('px-3 cursor-pointer rounded-lg', { 'hover:bg-white': router.asPath != href }, { 'font-bold bg-slate-800 text-white': router.asPath == href })}>{text ?? children}</li>
    </Link>;
}