import { Toaster } from 'react-hot-toast';
import { AppContextContainer } from '../components/app-context';
import { CheckConfig } from '../components/check-config';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }) {
  return <AppContextContainer>
      <CheckConfig>
        <Component {...pageProps} />
      </CheckConfig>
      <Toaster/>
  </AppContextContainer> 
}

export default MyApp