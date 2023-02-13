import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { AppContextContainer } from '../components/app-context';
import { CheckConfig } from '../components/check-config';
import { DialogsContainer } from '../components/dialog';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }) {
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

export default MyApp