import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';

export function Container({ children }) {
    return <div className="h-fit min-w-full absolute">
        <ul className="px-2 py-3 flex">
            <MenuLink href={"/users"} text={"Users"}/>
            <MenuLink href={"/server_config"} text={"Server Config"}/>
            <MenuLink href={"/logout"}>Logout</MenuLink>
        </ul>
        <div className="bg-white block shadow-md rounded-md mt-2 overflow-auto">
            {children}
        </div>
    </div>
}

function MenuLink({ href, text, children }) {
    const router = useRouter();
    return <Link href={href}>
        <li className={classNames('px-3 cursor-pointer rounded-lg', { 'hover:bg-white': router.asPath != href }, { 'font-bold bg-slate-800 text-white': router.asPath == href })}>{text ?? children}</li>
    </Link>;
}