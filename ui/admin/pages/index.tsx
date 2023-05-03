import { useRouter } from 'next/router';
import { useEffect } from "react";

export default function Index() {
    let router = useRouter();
    useEffect(() => {
        router.push('/home');
    }, [])
    return <></>
}