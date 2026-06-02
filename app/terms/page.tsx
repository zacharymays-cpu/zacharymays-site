// app/terms/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — Zachary S. Mays',
  description:
    'Terms of use, copyright notice, and permitted uses for the Cultiness Spectrum Dataset and zacharymays.com.',
}

export default function TermsPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">Legal</span>
          <h1 className="hero__title animate-up-2">Terms of Use</h1>
          <p className="hero__subtitle animate-up-3">
            Copyright, permitted uses, and the conditions under which this
            research may be cited, shared, and built upon.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">

          {/* ── Copyright ─────────────────────────────────────────────── */}
          <div className="section__label">Copyright</div>
          <p>
            All original content on this website — including but not limited to
            the Cultiness Spectrum Dataset, all organizational assessments, scoring
            rationales, criterion body text, analytical summaries, methodology
            documentation, and written works — is copyright &copy; 2026 Zachary S.
            Mays. All rights reserved except as expressly stated below.
          </p>
          <p>
            The ten criteria underlying the scoring framework are derived verbatim
            from Daniella Mestyanek Young and Amy Reed,{' '}
            <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer">
              <em>The Culting of America: What Makes a Cult and Why We Love Them</em>
            </a>{' '}
            (Otterpine, 2026). Those criteria are the intellectual property of
            their respective authors. The dual-metric scoring system, composite
            formula, V4.0 analytical framework, and all dataset content were
            developed independently and are original works of Zachary S. Mays.
          </p>

          <hr className="rule" />

          {/* ── Dataset as Compilation ────────────────────────────────── */}
          <div className="section__label">The Dataset as a Compilation</div>
          <p>
            The Cultiness Spectrum Dataset constitutes an original compilation
            under United States copyright law. The selection, arrangement,
            scoring methodology, analytical rationale, and written assessments
            represent substantial original authorship. Reproduction of the
            dataset in whole or in substantial part — including systematic
            scraping, bulk download for redistribution, or incorporation into
            competing databases or commercial products — is prohibited without
            express written permission.
          </p>

          <hr className="rule" />

          {/* ── Permitted Uses ────────────────────────────────────────── */}
          <div className="section__label">Permitted Uses</div>
          <p>
            The following uses are expressly permitted without prior written
            permission, provided attribution requirements below are met:
          </p>

          <div style={{
            display: 'grid',
            gap: '1px',
            background: 'rgba(212,206,196,0.1)',
            margin: '1.5rem 0',
          }}>
            {[
              {
                title: 'Academic Research & Citation',
                body: 'Researchers, students, and academics may cite individual organizational assessments, quote scoring rationales, and reference dataset findings in scholarly work with proper attribution.',
              },
              {
                title: 'Journalism & Commentary',
                body: 'Journalists and commentators may reference scores, tiers, and findings for reporting and analysis purposes. Direct quotation of criterion body text should be limited to the minimum necessary and attributed.',
              },
              {
                title: 'Educational Use',
                body: 'The dataset and methodology documentation may be used for educational purposes — in classrooms, workshops, and training contexts — with attribution. Reproduction of substantial portions for course materials requires permission.',
              },
              {
                title: 'Personal & Non-Commercial Use',
                body: 'Individuals may access, read, and share links to organizational assessments for personal, non-commercial purposes. Screenshots and limited excerpts for social sharing are permitted with attribution.',
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                style={{
                  background: 'var(--ink)',
                  padding: '1.5rem 2rem',
                }}
              >
                <p style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--paper)',
                  marginBottom: '0.4rem',
                }}>
                  {title}
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--muted)',
                  margin: 0,
                  lineHeight: 1.7,
                }}>
                  {body}
                </p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          {/* ── Prohibited Uses ───────────────────────────────────────── */}
          <div className="section__label">Prohibited Uses</div>
          <p>The following uses are prohibited without express written permission:</p>
          <ul style={{ color: 'var(--muted)', lineHeight: 2, paddingLeft: '1.5rem' }}>
            <li>Systematic scraping or bulk reproduction of dataset content</li>
            <li>Incorporation into commercial products, services, or databases</li>
            <li>Redistribution of the dataset or substantial portions thereof</li>
            <li>
              Derivative scoring systems that reproduce the methodology without
              attribution or that misrepresent the source
            </li>
            <li>
              Use of organizational assessments in advertising, political
              campaigns, or promotional materials
            </li>
            <li>
              Training machine learning models on dataset content without
              express written permission
            </li>
          </ul>

          <hr className="rule" />

          {/* ── Attribution ───────────────────────────────────────────── */}
          <div className="section__label">Attribution Requirements</div>
          <p>
            When citing or referencing this work, please use the following
            format:
          </p>
          <div style={{
            background: 'rgba(200,168,75,0.06)',
            border: '1px solid rgba(200,168,75,0.2)',
            padding: '1.5rem 2rem',
            margin: '1.5rem 0',
            fontFamily: 'var(--mono)',
            fontSize: '0.82rem',
            color: 'var(--muted)',
            lineHeight: 1.8,
          }}>
            Mays, Zachary S. <em style={{ fontStyle: 'italic' }}>Cultiness Spectrum Dataset</em>,
            HWGH-v1, Methodology V4.0 (2026).
            zacharymays.com. Applying the framework of Young, Daniella Mestyanek
            and Amy Reed, <em style={{ fontStyle: 'italic' }}>The Culting of America</em> (Otterpine, 2026).
          </div>
          <p>
            For citations to a specific organizational assessment, include the
            organization name and the URL of the assessment page.
          </p>

          <hr className="rule" />

          {/* ── Living Dataset Notice ─────────────────────────────────── */}
          <div className="section__label">Living Dataset Notice</div>
          <p>
            The Cultiness Spectrum Dataset is actively maintained. Scores,
            tiers, and body text are revised as methodology improves, new
            evidence becomes available, or errors are identified and corrected.
            Each organizational assessment displays its last revision date and
            the methodology version under which it was assessed. Citations
            should note the date of access.
          </p>
          <p>
            Score revisions are logged in the dataset's revision history.
            Prior versions of individual assessments are not archived publicly,
            but the methodology version system provides traceability to the
            analytical framework in effect at time of assessment.
          </p>

          <hr className="rule" />

          {/* ── No Warranty ───────────────────────────────────────────── */}
          <div className="section__label">No Warranty; Educational Purpose</div>
          <p>
            The Cultiness Spectrum Dataset is provided for educational and
            research purposes. All assessments represent analytical judgments
            based on publicly documented, verifiable information available at
            the time of scoring. They are not legal determinations, clinical
            diagnoses, or definitive characterizations of any organization or
            its members.
          </p>
          <p>
            This content is provided &ldquo;as is&rdquo; without warranty of any
            kind. Zachary S. Mays makes no representations regarding the
            completeness, accuracy, or fitness for any particular purpose of
            any assessment. Use of this content is at the user&rsquo;s own
            discretion.
          </p>

          <hr className="rule" />

          {/* ── Contact ───────────────────────────────────────────────── */}
          <div className="section__label">Permissions & Contact</div>
          <p>
            For permissions requests, licensing inquiries, corrections, or
            press contact:
          </p>
          <p>
            <a href="mailto:zachary.mays@icloud.com">zachary.mays@icloud.com</a>
          </p>

          {/* ── Footer notice ─────────────────────────────────────────── */}
          <div style={{
            marginTop: '3rem',
            padding: '1.25rem 1.5rem',
            background: 'rgba(244,240,232,0.03)',
            border: '1px solid rgba(212,206,196,0.1)',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              margin: 0,
            }}>
              Last updated: June 2026 &nbsp;·&nbsp; Methodology V4.0
              &nbsp;·&nbsp; &copy; 2026 Zachary S. Mays
            </p>
          </div>

        </div>
      </section>
    </>
  )
}
