import { Container } from "../components/container";
import useSWR from 'swr';
import { serverRequest } from "../util";

export default function UsersPage() {

    /**
     * @type {{
     *      data: V2RayConfigInbound[]
     * }}
     */
    let {data: inbounds} = useSWR('/inbounds', serverRequest);

    return <Container>
        <table className="w-full">
            <thead>
                <tr>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">ID</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">User</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">First connect</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Last connect</th>
                    <th className="px-1 py-2 border-b-2 border-b-blue-900">Client Config</th>
                </tr>
            </thead>
            <tbody>
                {!inbounds ? <tr><td colSpan={5}>Loading ...</td></tr> : inbounds.map(i => {
                    return <>
                        <tr key={"inbound-" + i.protocol}><td colSpan={5} className="uppercase font-bold bg-slate-100">{i.protocol}</td></tr>
                        {i.settings?.clients?.map(u => {
                            return <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.email}</td>
                                <td>{'-'}</td>
                                <td>{'-'}</td>
                                <td>{'-'}</td>
                            </tr>
                        })}
                    </>
                })}
            </tbody>
        </table>
    </Container>
    
}