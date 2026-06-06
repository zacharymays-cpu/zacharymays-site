import './globals.css';
import { Playfair_Display, Libre_Baskerville, DM_Mono } from 'next/font/google';
import Nav from '../components/Nav';

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: 'normal',
  variable: '--font-body',
  display: 'swap',
});
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://www.zacharymays.com'),
  title: { default: 'Zachary S. Mays', template: '%s — Zachary S. Mays' },
  description: 'Author and researcher. The Cultiness Spectrum dataset. How We Got Here. Assholes in History.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Zachary S. Mays',
    title: 'Zachary S. Mays',
    description: 'Author and researcher. The Cultiness Spectrum — a systematic, evenhanded assessment of cult-adjacent dynamics across American organizations.',
    url: 'https://www.zacharymays.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zachary S. Mays',
    description: 'The Cultiness Spectrum — a systematic, evenhanded assessment of cult-adjacent dynamics across American organizations.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${baskerville.variable} ${dmMono.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <div className="footer__inner">
              <p className="footer__text">© {new Date().getFullYear()} Zachary S. Mays</p>
              <p className="footer__text">
                Framework: Young &amp; Reed,{' '}
                <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer"
                   style={{color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(212,206,196,0.3)'}}>
                  The Culting of America
                </a>
              </p>
              <p className="footer__text">
                <a href="/terms"
                   style={{color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(212,206,196,0.3)'}}>
                  Terms of Use
                </a>
                {'  ·  '}
                <a href="/admin/review"
                   style={{color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(212,206,196,0.3)'}}>
                  Analyst login
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
