export const metadata = {
  title: 'About the Author',
  description: 'Zachary S. Mays — U.S. Marine Corps veteran, researcher, and author.',
};

export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">About the Author</span>
          <h1 className="hero__title animate-up-2">Zachary S. Mays</h1>
          <p className="hero__subtitle animate-up-3">
            U.S. Marine Corps veteran. Researcher. Author of two forthcoming books
            on institutional formation, leadership, and the recurring patterns
            of history.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="bio-layout">
            <div>
              <div style={{
                aspectRatio: '1/1',
                overflow: 'hidden',
                border: '1px solid rgba(212,206,196,0.15)',
              }}>
                <img
                  src="/zacharymays_profile.jpg"
                  alt="Zachary S. Mays"
                  style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
                />
              </div>
              <div style={{marginTop: '1.5rem'}}>
                <span className="tag">U.S. Marine Corps</span>
                <span className="tag">Djibouti</span>
                <span className="tag">Iraq</span>
                <span className="tag">Horn of Africa</span>
                <span className="tag">Researcher</span>
                <span className="tag">Author</span>
              </div>
            </div>

            <div>
              <div className="section__label">Background</div>

              <p>
                Zachary S. Mays is a U.S. Marine Corps veteran with deployments
                to Djibouti, Iraq, and the Horn of Africa. His background is in
                large-scale logistics, organizational planning, and information
                systems — fields that gave him a direct and sustained view of
                what happens when institutions fail to tell people what they
                need to hear.
              </p>

              <p>
                The first book started as a practical guide. Twenty-three of
                history's worst rulers made for excellent and frequently
                hilarious case studies in evaluating what leaders actually
                mean rather than what they say. The second came from a
                frustrating argument — a striking absence of historical
                grounding and independent critical thinking that made one
                thing clear: someone needed to write the manual.
              </p>

              <div className="pull-quote">
                <p className="pull-quote__text">
                  The questions <em>How We Got Here</em> raised about
                  high-control organizations and America's odd comfort with
                  them required more than argument. They required evidence.
                  That became the Organizational Coercion Index.
                </p>
              </div>

              <p>
                The Organizational Coercion Index applies Daniella Mestyanek
                Young and Amy Reed's framework from{' '}
                <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer">
                  <em>The Culting of America</em>
                </a>{' '}
                across hundreds of American organizations — systematically,
                evenhandedly, and publicly. It is a free educational resource
                and will remain one, now hosted at{' '}
                <a href="https://organizationalcoercionindex.org" target="_blank" rel="noopener noreferrer">
                  organizationalcoercionindex.org
                </a>.
              </p>

              <hr className="rule" />

              <div className="section__label">Publications</div>

              <div className="book-card">
                <p style={{fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem'}}>Forthcoming</p>
                <p style={{fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.25rem'}}>How We Got Here</p>
                <p style={{fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.05em', marginBottom: '1rem'}}>The Formation of a Population Built Not to Know</p>
                <p style={{fontSize: '0.9rem', color: 'var(--muted)', margin: 0}}>
                  A synthesis argument tracing how American theological,
                  educational, and institutional formation systems produced
                  a population psychologically primed for high-control group
                  dynamics — and why that was not an accident.
                </p>
              </div>

              <div className="book-card">
                <p style={{fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem'}}>Forthcoming</p>
                <p style={{fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.25rem'}}>Assholes in History</p>
                <p style={{fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.05em', marginBottom: '1rem'}}>
                  A Comprehensive Survey of Catastrophic Leadership, Spectacular Ego,
                  and the Recurring Human Failure to Say Temper, Temper
                </p>
                <p style={{fontSize: '0.9rem', color: 'var(--muted)', margin: 0}}>
                  Twenty-three of history's worst rulers as a practical guide
                  to evaluating what leaders and powerful people actually mean —
                  not what they say. The pattern is easier to see at historical
                  distance. The examples are genuinely funny.
                </p>
              </div>

              <hr className="rule" />

              <div className="section__label">Contact</div>
              <p style={{color: 'var(--muted)'}}>
                For press, speaking, and research inquiries:{' '}
                <a href="mailto:zachary@zacharymays.com">zachary@zacharymays.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
