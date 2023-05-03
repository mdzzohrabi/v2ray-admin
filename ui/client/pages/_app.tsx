import { DialogsContainer } from '@common/components/dialog';
import { clearCounter } from '@common/lib/hooks';
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import '../styles/globals.scss';

export default function App({ Component, pageProps }) {
  clearCounter();
  return <SWRConfig value={{ revalidateOnFocus: false }}>
      <DialogsContainer>
          <Component {...pageProps} />
          <Toaster/>
    </DialogsContainer>
  </SWRConfig>;
}