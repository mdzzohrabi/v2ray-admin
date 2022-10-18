import { Container } from "../components/container"
import { useRouter } from 'next/router';

export default function Index() {
    useRouter().push('/users');
    return <Container>
    </Container>
}