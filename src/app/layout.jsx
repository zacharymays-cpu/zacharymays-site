import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: { default: 'Zachary S. Mays', template: '%s — Zachary S. Mays' },
  description: 'Author and researcher. The Cultiness Spectrum dataset. How We Got Here. Assholes in History.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
