import Link from 'next/link';
import OrgCount from '../components/OrgCount';

export const metadata = {
  title: 'Zachary S. Mays — Author',
  description: 'Author of How We Got Here and Assholes in History. Home of the Organizational Coercion Index dataset.',
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section style={{padding: '8rem 0 6rem', borderBottom: '1px solid rgba(212,206,196,0.1)'}}>
        <div className="container--narrow">
          <span style={{fontFamily:'var(--mono)',fontSize:'0.7rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--muted)',display:'block',marginBottom:'2rem'}} className="animate-up">
            Zachary S. Mays
          </span>
          <h1 className="animate-up-2" style={{fontFamily:'var(--serif)',fontSize:'clamp(2.5rem, 5vw, 4.5rem)',lineHeight:1.1,letterSpacing:'-0.02em',color:'var(--paper)',marginBottom:'2.5rem'}}>
            Two books.<br />One recurring<br />
            <span style={{color:'var(--accent-text)'}}>pattern.</span>
          </h1>
          <p className="animate-up-3" style={{fontSize:'1.05rem',color:'var(--muted)',maxWidth:'520px',lineHeight:1.75,marginBottom:'3rem'}}>
            The machinery that produces catastrophic leaders is entirely human.
            In several cases, variations of it are running somewhere right now.
          </p>
          <div className="animate-up-4" style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
            <Link href="/how-we-got-here" className="btn-primary">How We Got Here</Link>
            <Link href="/assholes-in-history" className="btn-secondary">Assholes in History</Link>
          </div>
        </div>
      </section>

      {/* Books */}
      <section style={{padding:'5rem 0',borderBottom:'1px solid rgba(212,206,196,0.1)'}}>
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
            {[
              {
                href:'/how-we-got-here',
                eyebrow:'Analytical Non-Fiction',
                title:'How We Got Here',
                sub:'The Formation of a Population Built Not to Know',
                text:"Fifty years of deliberate institutional architecture produced a population psychologically primed for authoritarian formation. The dataset shows what it built.",
              },
              {
                href:'/assholes-in-history',
                eyebrow:'Forthcoming',
                title:'Assholes in History',
                sub:'A Comprehensive Survey of Catastrophic Leadership',
                text:"Twenty-four of history's most spectacularly awful rulers — not as monsters, but as products. The impulse is universal. The outcome is not.",
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

      {/* Cultiness Spectrum section */}
      <section style={{padding:'5rem 0',borderBottom:'1px solid rgba(212,206,196,0.1)'}}>
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center'}}>
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',display:'block',marginBottom:'1.25rem'}}>
                The Organizational Coercion Index
              </span>
              <h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.8rem,3vw,2.8rem)',lineHeight:1.15,letterSpacing:'-0.02em',color:'var(--paper)',marginBottom:'1.25rem'}}>
                <OrgCount /> American organizations.<br />One framework.
              </h2>
              <p style={{fontSize:'0.95rem',color:'var(--muted)',lineHeight:1.75,marginBottom:'2rem'}}>
                The empirical backbone of <em>How We Got Here</em> — a large-scale application of
                Daniella Mestyanek Young and Amy Reed's framework from{' '}
                <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer" style={{color:'var(--gold)'}}>
                  The Culting of America
                </a>{' '}
                across American institutions. Every organization scored on ten criteria,
                two independent metrics, publicly documented and freely available.
              </p>
              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <Link href="/explore" className="btn-primary">Explore the Dataset</Link>
                <Link href="/cultiness" className="btn-secondary">About the Project</Link>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
              {[
                {href:'/explore',         label:'Dataset Explorer',    desc:'Search, filter, and browse the full dataset'},
                {href:'/compass',         label:'Political Compass',   desc:'Organizations plotted by political and authority axes'},
                {href:'/cultiness/methodology',    label:'Methodology',         desc:'How the scoring works, criteria, and N/A rules'},
                {href:'/cultiness/findings',       label:'Key Findings',        desc:'The headline correlation, tier distribution, and benchmark comparisons'},
              ].map((item,i) => (
                <Link key={i} href={item.href} style={{
                  display:'block', padding:'1.25rem',
                  background:'rgba(244,240,232,0.03)',
                  border:'1px solid rgba(212,206,196,0.1)',
                  textDecoration:'none',
                  transition:'border-color 0.2s, background 0.2s',
                }}>
                  <div style={{fontFamily:'var(--serif)',fontSize:'0.95rem',fontWeight:700,color:'var(--paper)',marginBottom:'0.4rem'}}>{item.label}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',lineHeight:1.5}}>{item.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
