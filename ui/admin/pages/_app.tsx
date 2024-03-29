import { toast, Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { AppContextContainer } from '../components/app-context';
import { CheckConfig } from '../components/check-config';
import { DialogsContainer } from '@common/components/dialog';
import { clearCounter, setToast } from '@common/lib/hooks';
import '../styles/globals.scss'

export default function AdminApp({ Component, pageProps }) {
  clearCounter();
  setToast(toast);
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