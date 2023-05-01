import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { AppContextContainer } from '../../components/app-context';
import { CheckConfig } from '../../components/check-config';
import { DialogsContainer } from '../../components/dialog';
import { clearCounter } from '../../lib/hooks';

export default function AdminApp({ Component, pageProps }) {
  clearCounter();
  return <AppContextContainer>
        <SWRConfig value={{ revalidateOnFocus: false }}>
        <DialogsContainer>
          <CheckConfig>
            <Component {...pageProps} />
          </CheckConfig>
          <Toaster/>
      </DialogsContainer>
      </SWRConfig>
  </AppContextContainer> 
}