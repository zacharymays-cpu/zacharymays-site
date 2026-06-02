import Link from 'next/link';

export const metadata = {
  title: 'Zachary S. Mays — Author',
  description: 'Author of How We Got Here and Assholes in History.',
};

export default function HomePage() {
  return (
    <>
      <section style={{padding: '8rem 0 6rem', borderBottom: '1px solid rgba(212,206,196,0.1)'}}>
        <div className="container--narrow">
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--muted)', display: 'block',
            marginBottom: '2rem'
          }} className="animate-up">Zachary S. Mays</span>

          <h1 className="animate-up-2" style={{
            fontFamily: 'var(--serif)', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--paper)',
            marginBottom: '2.5rem'
          }}>
            Two books.<br />One recurring<br />
            <span style={{color: 'var(--accent)'}}>pattern.</span>
          </h1>

          <p className="animate-up-3" style={{
            fontSize: '1.05rem', color: 'var(--muted)', maxWidth: '520px',
            lineHeight: 1.75, marginBottom: '3rem'
          }}>
            The machinery that produces catastrophic leaders is entirely human.
            In several cases, variations of it are running somewhere right now.
          </p>

          <div className="animate-up-4" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Link href="/how-we-got-here" className="btn-primary">How We Got Here</Link>
            <Link href="/assholes-in-history" className="btn-secondary">Assholes in History</Link>
          </div>
        </div>
      </section>

      <section style={{padding: '5rem 0'}}>
        <div className="container">
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px'}}>
            {[
              {
                href: '/how-we-got-here',
                eyebrow: 'Analytical Non-Fiction',
                title: 'How We Got Here',
                sub: 'The Formation of a Population Built Not to Know',
                text: "Fifty years of deliberate institutional architecture produced a population psychologically primed for authoritarian formation. The dataset shows what it built.",
              },
              {
                href: '/assholes-in-history',
                eyebrow: 'Temper Temper Publications',
                title: 'Assholes in History',
                sub: 'A Comprehensive Survey of Catastrophic Leadership',
                text: "Twenty-three of history\'s most spectacularly awful rulers — not as monsters, but as products. The impulse is universal. The outcome is not.",
              }
            ].map((book, i) => (
              <Link key={i} href={book.href} className="book-card-link">
                <div className="book-card-inner">
                  <p className="book-card-eyebrow">{book.eyebrow}</p>
                  <h2 className="book-card-title">{book.title}</h2>
                  <p className="book-card-sub">{book.sub}</p>
                  <p className="book-card-text">{book.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
