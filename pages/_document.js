import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="sv">
      <Head>
        {/* Core-JS Polyfill för alla ES6/ES7-metoder i iOS 9 */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/core-js/3.32.0/minified.js"></script>
        {/* Fetch Polyfill */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/3.6.2/fetch.min.js"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
