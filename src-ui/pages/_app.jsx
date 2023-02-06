import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { AppContextContainer } from '../components/app-context';
import { CheckConfig } from '../components/check-config';
import { DialogsContainer } from '../components/dialog';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }) {
  return <AppContextContainer>
        <DialogsContainer>
          <SWRConfig value={{ revalidateOnFocus: false }}>
          <CheckConfig>
            <Component {...pageProps} />
          </CheckConfig>
          <Toaster/>
          </SWRConfig>
      </DialogsContainer>
  </AppContextContainer> 
}

export default MyApp