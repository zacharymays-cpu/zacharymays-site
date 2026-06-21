import Link from 'next/link';

export const metadata = {
  title: 'Methodology — The Organizational Coercion Index',
  description: 'How the Organizational Coercion Index scoring system works: Young\'s ten behavioral criteria, Lifton\'s psychological totalism (C11), dual-track scoring, evidence framework, jury methodology, and the human review gate. Current version: V6.0 (June 2026).',
};

const CRITERIA = [
  { id: 'C1',  name: 'Charismatic Leadership',        desc: 'A defined authority figure — or a central idea functioning in place of a person — whose directives are taken as truth and whose challengers are discredited. Does not require a living human leader; posthumous authority that is institutionally ratified and structurally unrevisable scores as high as or higher than a living leader.' },
  { id: 'C2',  name: 'Sacred Assumptions',            desc: 'Certain beliefs maintained against counter-evidence, with mantras repeated and alternatives dismissed. The key test is not whether beliefs exist but whether they are enforced against documented contradicting evidence. The most extreme form is architectural prevention of counter-evidence from being generated at all.' },
  { id: 'C3',  name: 'Transcendent Mission',          desc: 'A mission so large it justifies sacrifice, treats doubts as betrayal, and provides meaning in ways that override individual judgment. Organizations that structurally encourage internal dissent as an improvement mechanism score N/A — the structural opposite of this criterion.' },
  { id: 'C4',  name: 'Sublimation of Individuality',  desc: 'Identity demands, appearance and lifestyle conformity, and rest-as-weakness culture. Includes institutional statements that inflate membership value, creating a reputational double-bind where departure signals either rejection or poor judgment.' },
  { id: 'C5',  name: 'Isolation',                     desc: 'Information environment narrows, outside perspectives are dismissed, the world shrinks. Isolation through institutional ecosystem completeness — parallel schools, hospitals, media, employment — scores equivalently to geographic compound isolation. Mechanism specificity: institutional enforcement of isolation scores 8–10; algorithmic or voluntarily mediated isolation scores 5–7.' },
  { id: 'C6',  name: 'Private Vernacular',            desc: 'Specialized vocabulary that marks membership identity, encodes a way of understanding reality difficult to access from outside, and terminates inquiry rather than enabling it. Standard professional field vocabulary does not check this criterion — the test is whether vocabulary operates as epistemological closure, not merely institutional naming.' },
  { id: 'C7',  name: 'Us-Versus-Them',               desc: 'More-enlightened-than-outsiders framing, defectors characterized as broken or corrupt, disagreement framed as bigotry or betrayal. Appropriate labor-management framing in unions and symmetrical partisan framing in political parties are distinguished from pathological enemy-construction.' },
  { id: 'C8',  name: 'Exploitation of Labor',         desc: 'Sacrifice extracted as virtue, labor monetized through institutional control. Financial extraction coerced through doctrinal framing with salvific or mission stakes is labor extraction. Systematic sexual harassment maintained through institutional cover-up and NDA architecture also checks this criterion. The delivery mechanism — financial, physical, sexual, or psychological — does not moderate intensity scoring. Compensation engineered to create exit barriers rather than fairly reward labor also checks this criterion.' },
  { id: 'C9',  name: 'High Exit Costs',               desc: 'Departure produces social, economic, or identity costs; exit is framed as betrayal. Spiritual absolutism — where departure means eternal damnation, complete family rupture, and total social network dissolution — scores at the same level as physical confinement. Mechanism specificity: institutional enforcement of exit costs (asset forfeiture, career destruction, legal consequences) scores 7–10; reputational or social costs without enforcement infrastructure scores 3–6.' },
  { id: 'C10', name: 'Ends Justify the Means',        desc: 'Institutional harm tolerated in pursuit of mission, cover-ups occur, perpetrators are protected. Multi-generational non-correcting harm patterns score at the ceiling regardless of mechanism. The existence of internal dissenters who made the courageous choice within the same constraints establishes that compliant choices were genuine institutional choices, not forced outcomes.' },
  { id: 'C11', name: 'Psychological Totalism',        desc: 'Robert Jay Lifton\'s framework describes a system where ideology becomes totalizing: it extends into every domain of life (totality), is self-sealing against critique (closed system), demands intellectual conformity, uses thought-terminating clichés, enforces emotional regulation, splits reality into absolute categories, uses sacred science claims to override evidence, maintains control through identity fusion with the organization, creates dependency on the system for meaning and morality, and is intended to be permanent/irreversible. The degree to which an organization instantiates these characteristics measures the degree of psychological totalism — not ideology per se, but the structural mechanisms that prevent exit from thought itself.' },
];

export default function MethodologyPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/oci" style={{color: 'var(--gold)'}}>The Organizational Coercion Index</Link>
            {' '}— Methodology
          </span>
          <h1 className="hero__title hero__title--compact animate-up-2">How the<br />Scoring Works</h1>
          <p className="hero__subtitle hero__subtitle--compact animate-up-3">
            The framework, the dual-metric system, the scoring rules,
            and why each design decision was made.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--wide">

          <div className="section__label">The Source Framework</div>

          <p>
            <strong>Methodology Version: V6.0 (June 2026)</strong> — Dual-track scoring combining Young-Reed behavioral analysis (C1-C10) with Lifton’s psychological totalism framework (C11). Evidence-based jury methodology with formal validation metrics.
          </p>

          <p>
            Criteria C1–C10 are derived verbatim from Daniella Mestyanek Young and Amy Reed’s{' '}
            <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer">
              <em>The Culting of America: What Makes a Cult and Why We Love Them</em>
            </a>{' '}
            (Otterpine, 2026). Young and Reed define a cult as a group that meets these ten behavioral conditions. The composite scoring system was developed independently to extend analytical range for dataset-scale application — but the criteria themselves are Young and Reed’s.
          </p>

          <p>
            Criterion C11 (Psychological Totalism) is derived from Robert Jay Lifton’s clinical and historical research on ideological systems. Lifton’s framework examines the structural mechanisms that create totalizing control over thought, emotion, and identity — independent of the specific ideology.
          </p>

          <p>
            The three scoring outputs each measure a distinct dimension. Young’s Cultiness Score is a presence checklist (0–10): each of the ten behavioral criteria counts as “present” when the evidence shows it operating at a documented, recurring level — an intensity of 5 or higher on the criterion scale — and the score is simply the number of criteria present. The Composite Score reads those same per-criterion intensities but weights both how strongly each criterion applies (intensity) and how many apply (breadth) — producing a 0–100% scale that captures not just which criteria fire, but how powerfully and broadly. Lifton’s Totalism Score (C11) is an independent third axis measuring system-level psychological architecture: whether the organization structurally prevents exit from thought itself, regardless of its behavioral profile. The Cultiness and Composite scores are two different reductions of the same C1–C10 evidence (a presence count versus an intensity-weighted index); the Lifton totalism score is generated independently.
          </p>

          <hr className="rule" />

          <div className="section__label">The Eleven Criteria</div>

          <p style={{color: 'var(--muted)', marginBottom: '2rem'}}>
            Young and Reed define a cult as a group that exhibits these ten behavioral patterns. Lifton’s eleventh criterion examines the system-level psychological totalism that enables and sustains those patterns.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {CRITERIA.map((c, i) => (
              <div key={c.id} style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                gap: '1.5rem',
                padding: '1.75rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.1)',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                  paddingTop: '0.2rem',
                  fontWeight: 500,
                }}>{c.id}</div>
                <div>
                  <p style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--paper)',
                    marginBottom: '0.5rem',
                  }}>{c.name}</p>
                  <p style={{
                    color: 'var(--muted)',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Three Parallel Score Outputs</div>

          <p>
            Every organization receives three scores capturing different dimensions of institutional coercion. The Cultiness and Composite scores are two reductions of the same C1–C10 criterion intensities (a presence count versus an intensity-weighted index); the Lifton totalism score is generated independently. All three are provided.
          </p>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(212,206,196,0.1)', margin: '2rem 0'}}>
            {[
              {
                label: "Young's Cultiness Score",
                sub: '0–10 binary checklist',
                body: "Each of the ten criteria counts as present when its evidence reaches a documented, recurring intensity (5 or higher on the 1–10 criterion scale); the score is the count of present criteria. Produces three bands matching Young's Group Exit Checklist: Not Culty (0–2), Kinda Culty (3–5), Super Culty (6+). The presence threshold is essential — counting every criterion that merely has some evidence, rather than genuine documented presence, systematically inflates the score (an organization absent on every dynamic would otherwise read as a perfect 10).",
              },
              {
                label: 'Composite Score',
                sub: 'Formula-based 0–100%',
                body: 'Formula: (Breadth ÷ 10) × (Mean Intensity ÷ 10) × 100 (C1-C10 only). Breadth = criteria with non-N/A scores. Mean Intensity = average of those scores. Adds two dimensions the binary instrument cannot capture: intensity variance and breadth-intensity interaction. Produces three tiers: Low-Control (0–29%), Moderate-Control (30–59%), High-Control (≥60%).',
              },
              {
                label: "Totalism Score",
                sub: '0–10 intensity scale',
                body: 'Scores C11 (Psychological Totalism) on a 0–10 intensity scale, measuring the degree to which the organization exhibits system-level mechanisms that create totalizing control over thought and identity. Produces three classifications: Non-Totalizing (0–2.9), Moderately Totalizing (3–5.9), Psychologically Totalizing (6–10). Independent of C1-C10 scores. A behavioral cult (high C1-C10) may have low totalism (temporary structures); a totalizing system (high C11) may lack some behavioral hallmarks.',
              },
            ].map((item, i) => (
              <div key={i} style={{background: 'var(--ink)', padding: '2rem'}}>
                <p style={{fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.3rem'}}>{item.label}</p>
                <p style={{fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: '1rem'}}>{item.sub}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0}}>{item.body}</p>
              </div>
            ))}
          </div>

          <p style={{marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem'}}>
            These three outputs are independent variables, not conversions of each other. Divergence between them is analytically meaningful. For example, a military institution might score high on C1-C10 (charismatic command, obedience structures) but lower on C11 (totalism) if it maintains explicit time-limits and member exit pathways. A new religious movement might score moderate on C1-C10 but extreme on C11 if it structures every domain of life and uses identity fusion.
          </p>

          <hr className="rule" />

          <div className="section__label">Composite Score Tiers</div>

          <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
            The Composite Score (0–100%) maps to three tiers. These are the labels shown in the Dataset Explorer under the “Control Tier” column.
          </p>

          <div style={{margin: '1.5rem 0'}}>
            {[
              { range: '0–29%',    tier: 'Low-Control',       sub: 'Not Culty',    color: '#5cb878' },
              { range: '30–59%',   tier: 'Moderate-Control',  sub: 'Kinda Culty',  color: '#d99b3e' },
              { range: '≥60%',     tier: 'High-Control',      sub: 'Super Culty',  color: '#e8574d' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 200px 1fr',
                gap: '1.5rem',
                padding: '0.85rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'center',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--muted)'}}>{t.range}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '0.72rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--paper)', padding: '0.3rem 0.75rem',
                    background: t.color, display: 'inline-block', whiteSpace: 'nowrap',
                  }}>{t.tier}</div>
                  <div style={{fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'rgba(212,206,196,0.4)'}}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section__label" style={{marginTop: '2.5rem'}}>Cultiness Score Tiers (Young’s)</div>

          <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
            Young’s binary checklist (0–10 criteria met) maps to three bands, shown in the Dataset Explorer under the “Cultiness Tier” column.
          </p>

          <div style={{margin: '1.5rem 0'}}>
            {[
              { range: '0–2',  tier: 'Low-Control',       sub: 'Not Culty',    color: '#5cb878' },
              { range: '3–5',  tier: 'Moderate-Control',  sub: 'Kinda Culty',  color: '#d99b3e' },
              { range: '6–10', tier: 'High-Control',      sub: 'Super Culty',  color: '#e8574d' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 200px 1fr',
                gap: '1.5rem',
                padding: '0.85rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'center',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--muted)'}}>{t.range}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '0.72rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--paper)', padding: '0.3rem 0.75rem',
                    background: t.color, display: 'inline-block', whiteSpace: 'nowrap',
                  }}>{t.tier}</div>
                  <div style={{fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'rgba(212,206,196,0.4)'}}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section__label" style={{marginTop: '2.5rem'}}>Totalism Score Tiers (Lifton)</div>

          <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
            The Totalism Score (0–10) maps to three classifications, shown in the Dataset Explorer under the “Totalism Tier” column.
          </p>

          <div style={{margin: '1.5rem 0'}}>
            {[
              { range: '0–2.9', tier: 'Non-Totalizing',            color: '#5f8f86' },
              { range: '3–5.9', tier: 'Moderately Totalizing',      color: '#6d83b5' },
              { range: '6–10',  tier: 'Psychologically Totalizing', color: '#a06cd5' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '1.5rem',
                padding: '0.85rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'center',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--muted)'}}>{t.range}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.72rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--paper)', padding: '0.3rem 0.75rem',
                  background: t.color, display: 'inline-block', whiteSpace: 'nowrap',
                }}>{t.tier}</div>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">The N/A Rule</div>

          <p>
            Each criterion receives either a score of 1–10 or N/A.
            N/A is not a floor score. N/A designates structural absence —
            the criterion describes a dynamic that is inapplicable because
            the organization lacks the architecture for it, or because the
            organization’s documented behavior is the structural opposite
            of what the criterion describes.
          </p>

          <p>
            Never assign N/A to soften a low score. Never assign a floor
            number when the evidence says the dynamic is absent. When body
            text explicitly states a dynamic is not operative, the score must
            be N/A — not 1 or 2. The distinction matters because N/A criteria
            are excluded from both the breadth count and the mean intensity
            calculation. Phantom scoring — floor numbers on structurally absent
            criteria — artificially inflates composite scores and produces
            misleading results.
          </p>

          <hr className="rule" />

          <div className="section__label">Per-Criterion Intensity Scale</div>

          <div style={{margin: '1.5rem 0'}}>
            {[
              { score: 'N/A', desc: 'Criterion structurally inapplicable — dynamic not operative and organization lacks the architecture for it' },
              { score: '1–2', desc: 'Essentially no evidence of this dynamic' },
              { score: '3–4', desc: 'Mild, occasional, or incidental presence' },
              { score: '5–6', desc: 'Moderate, recurring presence with documented examples' },
              { score: '7–8', desc: 'Strong, systematic presence across multiple documented behaviors' },
              { score: '9–10', desc: 'Extreme, defining feature with documented evidence of harm' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1.5rem',
                padding: '0.85rem 0', borderBottom: '1px solid rgba(212,206,196,0.08)',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 500}}>{row.score}</div>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', margin: 0}}>{row.desc}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Evidence Standards</div>

          <p>
            Scores are anchored to publicly documented, verifiable behaviors —
            not reputation, not impression, not general public perception.
            Acceptable sources include court records and regulatory findings,
            investigative journalism from publications meeting T1–T2 credibility
            standards, peer-reviewed academic scholarship, government reports,
            and institutional self-documentation. Each criterion score includes
            at least one specific, verifiable example with citation.
          </p>

          <p>
            Where evidence is limited, contested, or primarily indirect,
            confidence is rated Low and noted explicitly. The methodology
            does not paper over uncertainty.
          </p>

          <hr className="rule" />

          <div className="section__label">Evidence-Based Jury Methodology (V6.0)</div>

          <p>
            All scores — across all three output tracks (Young’s, Composite, and Totalism) — are generated by an evidence-based jury protocol that eliminates calibration drift:
          </p>

          <ol style={{color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7}}>
            <li style={{marginBottom: '0.75rem'}}>An evidence brief is compiled for each criterion — documented behaviors from court records, investigative journalism, academic scholarship, and institutional documentation.</li>
            <li style={{marginBottom: '0.75rem'}}>The evidence brief is scored independently by four AI models (Claude, GPT-4o, Gemini, Llama) — no general knowledge, only the provided evidence. Models never see each other’s scores.</li>
            <li style={{marginBottom: '0.75rem'}}>The jury mean becomes the proposed score; a score spread greater than 5 points triggers additional review and evidence re-evaluation.</li>
            <li style={{marginBottom: '0.75rem'}}>For Young’s Cultiness Score: the binary checklist is derived from the jury intensity scores (≥5 = checks; &lt;5 = does not check) for consistency and auditability.</li>
            <li style={{marginBottom: '0.75rem'}}>For Composite: formula applied to the jury-derived intensity scores, using the four-model consensus as the basis.</li>
            <li style={{marginBottom: '0.75rem'}}>For Totalism (C11): jury intensity scores for psychological totalism mechanisms, independent of C1-C10.</li>
            <li style={{marginBottom: '0.75rem'}}>A four-model consensus at 0–2 point spread indicates high reliability. Results include Krippendorff’s alpha and pairwise agreement metrics.</li>
          </ol>

          <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginTop: '1rem'}}>
            This dual-track methodology corrected systematic upward bias that existed in previous anchor-calibrated versions, particularly for C5 (Isolation), C8 (Labor Exploitation), and C9 (Exit Costs) when applied to political and media organizations. The addition of Lifton’s C11 adds system-level totalism measurement orthogonal to behavioral indicators.
          </p>

          <hr className="rule" />

          <div className="section__label">The Human Review Gate</div>

          <p>
            AI-assisted scoring is used to generate proposed assessments at
            scale. Every proposed score — jury mean or solo assessment — passes through human review before
            entering the dataset. The reviewer verifies that each score is
            consistent with the body text, that N/A designations have
            structural rationale, that cited sources support the claims made,
            and that the assessment reflects consistent application of the
            methodology across the ideological and cultural spectrum.
          </p>

          <p>
            The AI proposes. The human decides. No score enters the published
            dataset without that review.
          </p>

          <div style={{marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Link href="/oci/findings" className="btn-primary">See the Findings</Link>
            <Link href="/oci/dataset" className="btn-secondary">Explore the Dataset</Link>
          </div>

        </div>
      </section>
    </>
  );
}
