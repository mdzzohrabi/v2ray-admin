import { Container } from "../components/container"
import { useRouter } from 'next/router';
import { useEffect } from "react";

export default function Index() {
    let router = useRouter();
    useEffect(() => {
        router.push('/users');
    }, [])
    return <Container>
    </Container>
}