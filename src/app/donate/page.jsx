import OrgCount from '../../components/OrgCount';

export const metadata = {
  title: 'Support the Project',
  description: 'Support the Cultiness Spectrum research project and the work of Zachary S. Mays.',
};

export default function DonatePage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">Support the Work</span>
          <h1 className="hero__title animate-up-2">Keep This<br />Going</h1>
          <p className="hero__subtitle animate-up-3">
            The Cultiness Spectrum is a free, public educational resource.
            If it has been useful to you, consider supporting its continued
            development.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">

          <div className="section__label">About This Project</div>

          <p>
            The first manuscript started as a practical guide — using twenty-four
            of history's worst rulers to build the skills to evaluate what leaders
            and powerful people actually mean, not what they say. The second came
            from a frustrating argument. A complete absence of historical
            understanding and independent critical thinking on the other side of it
            made one thing clear: someone needed to write the manual that explains
            how America arrived where it did.
          </p>

          <p>
            The questions <em>How We Got Here</em> raised about high-control
            organizations and America's odd comfort with them required more than
            argument. That became the Cultiness Spectrum Dataset — a systematic,
            evenhanded application of the Young-Reed framework across <OrgCount /> American
            organizations, publicly available and free to use.
          </p>

          <p style={{color: 'var(--muted)', fontStyle: 'italic'}}>
            — Zachary S. Mays, U.S. Marine Corps veteran
          </p>

          <hr className="rule" />

          <div className="section__label">Support the Dataset</div>

          <div style={{
            background: 'rgba(244,240,232,0.03)',
            border: '1px solid rgba(212,206,196,0.15)',
            padding: '2.5rem',
            margin: '1.5rem 0',
            position: 'relative',
          }}>
            <div style={{position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: 'var(--gold)'}} />
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '0.7rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--gold)', marginBottom: '0.75rem',
            }}>Buy Me a Coffee</p>

            <p style={{fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.75}}>
              The Cultiness Spectrum Dataset is and will remain free to access,
              explore, and use. In an effort to continue providing and expanding
              this dataset to the public at no charge — covering research time,
              infrastructure, API costs, and the ongoing work of scoring new
              organizations and refining existing assessments — any contribution
              is genuinely appreciated.
            </p>

            <a
              href="https://buymeacoffee.com/zacharymays"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{display: 'inline-block'}}
            >
              Buy Me a Coffee
            </a>
          </div>

          <hr className="rule" />

          <div className="section__label">What Your Support Funds</div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0', margin: '1rem 0 2.5rem'}}>
            {[
              { item: 'New organization assessments', desc: <>Each entry requires research, evidence review, scoring, and human validation. The dataset is at <OrgCount /> organizations and growing.</> },
              { item: 'Body text audit and revision', desc: 'Roughly 25% of existing entries have placeholder content pending evidence-based body text. This is ongoing work.' },
              { item: 'Methodology refinement', desc: 'Keeping the analytical framework current, internally consistent, and defensible as a research resource.' },
              { item: 'Infrastructure', desc: 'Hosting, database, and API costs for the public dataset and this site.' },
            ].map((row, i) => (
              <div key={i} style={{
                borderLeft: '2px solid rgba(200,168,75,0.2)',
                paddingLeft: '1.75rem',
                paddingBottom: '1.5rem',
                marginBottom: '0.25rem',
              }}>
                <p style={{fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--paper)', marginBottom: '0.4rem'}}>{row.item}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0}}>{row.desc}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Other Ways to Help</div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0', margin: '1rem 0'}}>
            {[
              {
                action: 'Share the project',
                desc: 'If the dataset or methodology has been useful, sharing it with others who study organizations, institutions, or political psychology is genuinely helpful.',
              },
              {
                action: 'Follow on YouTube',
                desc: 'Discussion of the dataset, methodology, and findings.',
                link: 'https://www.youtube.com/@mayszs',
                linkLabel: 'youtube.com/@mayszs',
              },
              {
                action: "Follow Daniella Mestyanek Young's platform",
                desc: "The framework this project is built on comes from Young and Reed's work. Their platform is where the source framework lives.",
                link: 'https://uncultureyourself.com',
                linkLabel: 'uncultureyourself.com',
              },
              {
                action: 'Engage with the GitHub repository',
                desc: 'The dataset is public. Stars, forks, and issues on the repository help establish its credibility as a research resource.',
                link: 'https://github.com/zacharymays-cpu/cultiness-spectrum',
                linkLabel: 'github.com/zacharymays-cpu/cultiness-spectrum',
              },
            ].map((row, i) => (
              <div key={i} style={{padding: '1.25rem 0', borderBottom: '1px solid rgba(212,206,196,0.08)'}}>
                <p style={{fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--paper)', marginBottom: '0.4rem'}}>
                  {row.action}
                </p>
                <p style={{color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0}}>
                  {row.desc}{row.link && (
                    <> <a href={row.link} target="_blank" rel="noopener noreferrer" style={{color: 'var(--gold)'}}>{row.linkLabel}</a></>
                  )}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
