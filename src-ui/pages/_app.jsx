import { Toaster } from 'react-hot-toast';
import { AppContextContainer } from '../components/app-context';
import { CheckConfig } from '../components/check-config';
import { DialogsContainer } from '../components/dialog';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }) {
  return <DialogsContainer>
    <AppContextContainer>
        <CheckConfig>
          <Component {...pageProps} />
        </CheckConfig>
        <Toaster/>
    </AppContextContainer> 
  </DialogsContainer>
}

export default MyApp