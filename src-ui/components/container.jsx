import Link from 'next/link';

export function Container({ children }) {
    return <div className="container mx-auto">
        <ul className="px-2 py-3">
            <Link href={"/users"} ><li>Users</li></Link>
            <Link href={"/routing"}><li>Routing</li></Link>
        </ul>
        <div className="bg-white shadow-md rounded-md mt-2">
            {children}
        </div>
    </div>
}