import Link from 'next/link';
import OrgCount from '../../../components/OrgCount';

export const metadata = {
  title: 'The Dataset — The Organizational Coercion Index',
  description: 'What the Organizational Coercion Index Dataset contains, how it is structured, and how to access it.',
};

const CATEGORIES = [
  { name: 'Religious denominations',          count: '~60', note: 'Evangelical, Catholic, mainline Protestant, high-control NRMs, and historical formations' },
  { name: 'Political movements & parties',    count: '~35', note: 'Across the full ideological spectrum — assessed by identical criteria' },
  { name: 'Military formations',              count: '~20', note: 'All US service branches, special operations formations, and historical military institutions' },
  { name: 'Federal agencies',                 count: '~30', note: 'Intelligence community, law enforcement, regulatory agencies, and cabinet departments' },
  { name: 'Corporate employers',              count: '~25', note: 'Tech, finance, pharma, defense contractors, and retail' },
  { name: 'Media institutions',               count: '~20', note: 'Broadcast, print, digital, and ideological media formations' },
  { name: 'Educational institutions',         count: '~15', note: 'Universities, K-12 systems, and homeschool formations' },
  { name: 'Advocacy & civil society',         count: '~30', note: 'Civil rights, labor, environmental, and ideological advocacy organizations' },
  { name: 'Historical calibration anchors',  count: '37',  note: 'Domestic and international historical formations used to bracket the scoring spectrum' },
];

export default function DatasetPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/cultiness" style={{color: 'var(--gold)'}}>The Organizational Coercion Index</Link>
            {' '}— The Dataset
          </span>
          <h1 className="hero__title animate-up-2">What Was<br />Assessed</h1>
          <p className="hero__subtitle animate-up-3">
            <OrgCount /> active American organizations. 37 calibration anchors.
            Publicly available, openly documented, and ongoing.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">

          <div className="section__label">Structure</div>

          <p>
            Each organization in the dataset receives a complete assessment
            across all ten criteria. Every entry includes:
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0', margin: '1.5rem 0 2rem'}}>
            {[
              'Per-criterion intensity scores (1–10 or N/A) with documented rationale',
              'Evidence-based body text for each criterion with source citations',
              'Confidence rating (High / Medium / Low) per criterion',
              "Young's Original Score (0–10, binary checklist, independently derived)",
              'Composite Cultiness Score (formula-based, 0–100%)',
              'Composite tier classification',
              'Trajectory assessment (Stable / Escalating / Declining / Defunct)',
              'Political compass position (Economic axis and Authority axis, independent of cultiness scores)',
              'One-paragraph summary assessment',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', padding: '0.75rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.65rem',
                  color: 'var(--gold)', marginTop: '0.2rem', flexShrink: 0,
                }}>—</div>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6}}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">What's Included</div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0', margin: '1.5rem 0'}}>
            {CATEGORIES.map((cat, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 50px',
                gap: '1.5rem', padding: '1.25rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'start',
              }}>
                <div>
                  <p style={{fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--paper)', marginBottom: '0.3rem'}}>{cat.name}</p>
                  <p style={{fontFamily: 'var(--body)', fontSize: '0.85rem', color: 'var(--muted)', margin: 0}}>{cat.note}</p>
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.8rem',
                  color: 'var(--gold)', textAlign: 'right', paddingTop: '0.15rem',
                }}>{cat.count}</div>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Calibration Anchors</div>

          <p>
            The dataset includes 37 calibration anchors — historical and
            international organizations used to bracket the scoring spectrum
            and ensure consistency across assessment sessions. Anchors span
            from organizations scoring at the Super Culty ceiling (100% composite,
            10/10 Young's) to the Not Culty floor (5% composite, 0/10
            Young's). They are audited against current methodology after
            each versioned methodology update.
          </p>

          <p>
            Calibration anchors include both extreme cases (Aum Shinrikyo,
            Peoples Temple, the Khmer Rouge) and reference floor cases
            (Costco, at 5% composite, serves as the Not Culty anchor —
            demonstrating what high institutional loyalty and strong employee
            satisfaction look like in the complete absence of formation-system
            architecture).
          </p>

          <hr className="rule" />

          <div className="section__label">Methodology Versioning</div>

          <p>
            The dataset is under active development. Every score change is
            recorded in an immutable audit log with timestamp, rationale,
            and the methodology version under which it was made. The
            analytical principles governing scoring are documented in a
            versioned methodology reference — currently at V4.0, reflecting
            refinements from systematic divergence review conducted in 2026.
          </p>

          <p>
            Scores are analytical assessments anchored to publicly verifiable
            documented behaviors, not definitive determinations. Where evidence
            is limited or contested, this is noted explicitly in the entry.
          </p>

          <hr className="rule" />

          <div className="section__label">Access</div>

          <div style={{
            background: 'rgba(244,240,232,0.03)',
            border: '1px solid rgba(212,206,196,0.15)',
            padding: '2.5rem',
            margin: '1rem 0 2rem',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '3px', height: '100%',
              background: 'var(--gold)',
            }} />
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '0.7rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--gold)', marginBottom: '0.75rem',
            }}>Public Repository</p>
            <p style={{fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.25rem'}}>
              The dataset, methodology documentation, scoring engine, and
              full audit trail are publicly available on GitHub.
            </p>
            <a
              href="https://github.com/zacharymays-cpu/cultiness-spectrum"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{display: 'inline-block'}}
            >
              View on GitHub
            </a>
          </div>

          <hr className="rule" />

          <div className="section__label">Limitations and Honest Disclosures</div>

          <p>
            The dataset is not complete. Approximately 25% of entries
            currently have body texts that are thin, template-generated,
            or pending evidence-based revision. These are flagged in the
            repository and represent active work rather than finished
            assessments. Scores on entries with low-confidence body texts
            should be treated accordingly.
          </p>

          <p>
            Evidence availability varies substantially across organizational
            types. High-profile religious movements, political organizations,
            and publicly traded corporations have extensive public documentation.
            Some smaller or more opaque organizations have limited public
            records, and their scores reflect that limitation.
          </p>

          <p>
            The methodology has evolved over time. Earlier assessments were
            scored under less refined standards than the current V4.0
            methodology. Systematic divergence review has corrected the most
            significant inconsistencies, but cross-batch variation remains
            a known limitation. A full rescore against current methodology
            is in progress.
          </p>

          <div style={{marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Link href="/cultiness/methodology" className="btn-primary">Read the Methodology</Link>
            <Link href="/cultiness/findings" className="btn-secondary">See the Findings</Link>
          </div>

        </div>
      </section>
    </>
  );
}
