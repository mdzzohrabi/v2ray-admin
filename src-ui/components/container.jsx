import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';

export function Container({ children }) {
    return <div className="container mx-auto">
        <ul className="px-2 py-3 flex">
            <MenuLink href={"/users"} text={"Users"}/>
            <MenuLink href={"/server_config"} text={"Server Config"}/>
            <MenuLink href={"/logout"}>Logout</MenuLink>
        </ul>
        <div className="bg-white shadow-md rounded-md mt-2 overflow-scroll">
            {children}
        </div>
    </div>
}

function MenuLink({ href, text, children }) {
    const router = useRouter();
    return <Link href={href}>
        <li className={classNames('px-3 cursor-pointer', { 'font-bold bg-white rounded-lg': router.asPath == href })}>{text ?? children}</li>
    </Link>;
}