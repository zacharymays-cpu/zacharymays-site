import OrgCount from '../../components/OrgCount';
import Correlation from '../../components/Correlation';

export const metadata = {
  title: 'How We Got Here',
  description: 'The Formation of a Population Built Not to Know — by Zachary S. Mays.',
};

export default function HowWeGotHerePage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">A Book by Zachary S. Mays</span>
          <h1 className="hero__title animate-up-2">How We Got Here</h1>
          <p className="hero__subtitle animate-up-3">
            The Formation of a Population Built Not to Know
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">The Argument</div>

          <p style={{fontSize: '1.1rem', color: 'var(--cream)', lineHeight: 1.8}}>
            They were not a failure of individual rationality. They were a product.
          </p>

          <p>
            <em>How We Got Here</em> traces how American formation systems —
            theological, educational, and institutional — spent roughly fifty years
            systematically producing a population psychologically primed for
            high-control group dynamics. The central argument is that this was not
            a matter of individual susceptibility. It was deliberate institutional
            architecture.
          </p>

          <p>
            That architecture is traceable: through theological compliance systems
            that taught unquestioning deference to authority as a spiritual virtue,
            through anti-majoritarian political design that concentrated power by
            fragmenting popular will, through a consent infrastructure that runs
            from Edward Bernays through Roger Ailes to the algorithmic media
            environments of the present.
          </p>

          <div className="pull-quote">
            <p className="pull-quote__text">
              "This was not a matter of individual susceptibility. The
              population built not to know was built deliberately, by
              institutions that understood exactly what they were doing."
            </p>
          </div>

          <hr className="rule" />

          <div className="section__label">The Empirical Backbone</div>

          <p>
            The book's analytical argument is grounded in the Cultiness Spectrum
            Dataset — a large-scale application of Daniella Mestyanek Young and
            Amy Reed's framework from{' '}
            <em>The Culting of America</em> (Otterpine, 2026) across{' '}
            <OrgCount /> American organizations. The dataset applies a dual-metric
            scoring system across ten criteria, producing independent assessments
            that allow systematic comparison across institutional categories that
            are rarely examined together.
          </p>

          <p>
            A megachurch and a media company and a federal agency score on the
            same instrument. The divergence is informative. So is the overlap.
          </p>

          <p>
            The result is a body of evidence that allows the book's argument to
            move from historical claim to measurable pattern. The correlation
            between authority-axis position and composite cultiness score
            is <Correlation />. This is not a coincidence. It is the architecture,
            documented.
          </p>

          <div className="book-card">
            <p style={{fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem'}}>
              Key Finding
            </p>
            <p style={{fontFamily: 'var(--serif)', fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--cream)', lineHeight: 1.6, margin: 0}}>
              r = <Correlation /> correlation between authority-axis political position
              and composite cultiness score across <OrgCount /> American organizations.
              The formation pipeline is measurable. It has been running for
              fifty years. The dataset shows what it produced.
            </p>
          </div>

          <hr className="rule" />

          <div className="section__label">The Formation Pipelines</div>

          <p>
            The book documents three interlocking formation pipelines — not as
            conspiracy, but as institutional logic playing out over decades:
          </p>

          <div style={{margin: '2rem 0'}}>
            {[
              {
                label: 'The Religious Formation Pipeline',
                text: 'From prosperity theology and biblical inerrancy movements through the Moral Majority and Christian nationalism to the contemporary evangelical formation system — a multi-decade project that transformed American Protestantism from a heterodox theological tradition into a compliance architecture.'
              },
              {
                label: 'The Political Formation Pipeline',
                text: 'From the Powell Memo through the think-tank infrastructure, conservative talk radio, Fox News, the Daily Wire, and algorithmic media — a consent infrastructure built specifically to produce and maintain a population that could not be reached by counter-evidence.'
              },
              {
                label: 'The Structural Design',
                text: 'The structural design that made all of the above possible: the mechanisms by which minority rule became institutionally sustainable, and the population psychology that made it politically viable.'
              }
            ].map((item, i) => (
              <div key={i} style={{
                borderLeft: '1px solid rgba(212,206,196,0.2)',
                paddingLeft: '1.5rem',
                marginBottom: '2rem'
              }}>
                <p style={{
                  fontFamily: 'var(--serif)',
                  fontWeight: 700,
                  color: 'var(--paper)',
                  marginBottom: '0.5rem'
                }}>{item.label}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.95rem', margin: 0}}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">The Framework</div>

          <p>
            The dataset applies Young and Reed's ten-criterion framework across
            organizations spanning religious denominations, political movements,
            military formations, federal agencies, corporate cultures, media
            institutions, and educational systems. Two independent instruments
            produce scores that are never converted between each other — their
            divergence is itself analytically meaningful.
          </p>

          {/* TODO(dataset URL): linked to the on-site dataset explorer (/explore); swap if an external/download URL is preferred. */}
          <p>
            The framework is publicly documented. The dataset is published and
            freely available in the <a href="/explore">dataset explorer</a>.
          </p>

          <p>
            Written by a U.S. Marine Corps veteran whose career in logistics and
            information systems gave him a direct view of what happens when
            institutions fail to tell people what they need to hear.
          </p>

          <div style={{
            background: 'rgba(244,240,232,0.03)',
            border: '1px solid rgba(212,206,196,0.12)',
            padding: '2rem',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '1rem'
            }}>Forthcoming</p>
            <p style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.4rem',
              fontStyle: 'italic',
              color: 'var(--paper)',
              margin: 0
            }}>
              Publication details to be announced.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
