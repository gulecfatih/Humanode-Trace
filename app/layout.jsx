import '@mantine/core/styles.css';
import './globals.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { theme } from './theme';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Humanode Explorer & Forensics | Proof-of-Humanity Analytics',
  description: 'Humanode Substrate + EVM çift katmanlı blok kaşifi, adli cüzdan takibi, biyometrik validatör sağlığı ve tokenomi paneli.',
  openGraph: {
    title: 'Humanode Explorer & Forensics | Proof-of-Humanity Analytics',
    description: 'Humanode Substrate + EVM çift katmanlı blok kaşifi, adli cüzdan takibi, biyometrik validatör sağlığı ve tokenomi paneli.',
    siteName: 'Humanode-Trace',
    images: [
      {
        url: '/apple-icon.png',
        width: 180,
        height: 180,
        alt: 'Humanode Trace Logo',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Humanode Explorer & Forensics',
    description: 'Çift katmanlı blok kaşifi ve adli cüzdan takip platformu.',
    images: ['/apple-icon.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '48x48' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" forceColorScheme="dark" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
