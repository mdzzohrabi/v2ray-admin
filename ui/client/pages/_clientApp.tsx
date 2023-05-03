import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { DialogsContainer } from '@common/components/dialog';
import { clearCounter } from '@common/lib/hooks';

export default function ClientApp({ Component, pageProps }) {
  clearCounter();
  return <SWRConfig value={{ revalidateOnFocus: false }}>
        <DialogsContainer>
            <Component {...pageProps} />
            <Toaster/>
      </DialogsContainer>
    </SWRConfig>;
}