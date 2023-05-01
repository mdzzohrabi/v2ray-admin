import '../styles/globals.scss';
import { useRouter } from 'next/router';
import AdminApp from './admin/_adminApp';
import ClientApp from './_clientApp';

export default function App({ ...props }) {
  const router = useRouter();
  // @ts-ignore
  return router.pathname.startsWith('/admin') ? <AdminApp {...props}/> : <ClientApp {...props}/>;
}