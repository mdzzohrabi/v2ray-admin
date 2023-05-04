import { DialogsContainer } from '@common/components/dialog';
import { clearCounter, setToast } from '@common/lib/hooks';
import { toast, Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import '../styles/globals.scss';

export default function App({ Component, pageProps }) {
  clearCounter();
  setToast(toast);
  return <SWRConfig value={{ revalidateOnFocus: false }}>
      <DialogsContainer>
          <Component {...pageProps} />
          <Toaster/>
    </DialogsContainer>
  </SWRConfig>;
}