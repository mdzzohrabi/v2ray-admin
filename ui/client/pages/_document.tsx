import { Html, Head, Main, NextScript } from 'next/document';
import { __ } from '../locale';
 
export default function Document() {
  return (
    <Html dir={__('direction') ?? 'ltr'}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}