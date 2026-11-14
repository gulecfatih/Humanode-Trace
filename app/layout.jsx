import '@mantine/core/styles.css';
import './globals.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { theme } from './theme';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Humanode Explorer & Forensics | Proof-of-Humanity Analytics',
  description: 'Humanode Substrate + EVM dual-layer block explorer, forensic wallet tracking, biometric validator health and tokenomics analytics.',
  openGraph: {
    title: 'Humanode Explorer & Forensics | Proof-of-Humanity Analytics',
    description: 'Humanode Substrate + EVM dual-layer block explorer, forensic wallet tracking, biometric validator health and tokenomics analytics.',
    siteName: 'Humanode-Trace',
    images: [
      {
        url: '/apple-icon.png',
        width: 180,
        height: 180,
        alt: 'Humanode Trace Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Humanode Explorer & Forensics',
    description: 'Dual-layer block explorer and forensic wallet tracking platform.',
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
    <html data-mantine-color-scheme="light">
      <head>
        <ColorSchemeScript defaultColorScheme="light" forceColorScheme="light" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light" forceColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
