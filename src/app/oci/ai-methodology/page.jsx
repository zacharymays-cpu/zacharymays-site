import Link from 'next/link';
import OrgCount from '../../../components/OrgCount';

export const metadata = {
  title: 'AI-Enabled Scoring — The Organizational Coercion Index',
  description: 'Full transparency on how AI is used in the Organizational Coercion Index scoring process — what it does, why, the benefits, and the tradeoffs.',
};

export default function AiMethodologyPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/oci" style={{color: 'var(--gold)'}}>The Organizational Coercion Index</Link>
            {' '}—{' '}
            <Link href="/oci/methodology" style={{color: 'var(--gold)'}}>Methodology</Link>
          </span>
          <h1 className="hero__title animate-up-2">AI-Enabled<br />Scoring</h1>
          <p className="hero__subtitle animate-up-3">
            Full transparency on how artificial intelligence is used in
            this project — what it does, what it cannot do, why the
            approach was chosen, and where the risks are.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">

          <div className="section__label">The Short Version</div>

          <p style={{fontSize: '1.05rem', color: 'var(--cream)', lineHeight: 1.8}}>
            AI generates proposed assessments. Humans review and approve every
            single one before it enters the published dataset. Nothing reaches
            the public record without that review.
          </p>

          <p>
            That is not a disclaimer buried at the bottom of a methodology
            document. It is the design. The rest of this page explains why
            the pipeline was built this way, what it actually does well,
            where it introduces risk, and what the review process looks like
            in practice.
          </p>

          <hr className="rule" />

          <div className="section__label">Why AI Was Used At All</div>

          <p>
            The Cultiness Spectrum Dataset covers <OrgCount /> organizations across
            every major category of American institutional life. Each
            organization requires assessment across ten criteria, with
            evidence-based body text, source citations, confidence ratings,
            trajectory assessment, and two independent metric scores.
            Producing that at scale — consistently, evenhandedly, and to a
            documented methodological standard — is not feasible for a
            single researcher working manually.
          </p>

          <p>
            The alternative to AI-assisted scoring is not a better dataset.
            It is a much smaller one, produced more slowly, with less
            cross-batch consistency because the researcher's judgment
            naturally drifts over time. A dataset of 50 organizations
            scored manually over two years answers fewer questions and
            introduces its own consistency problems.
          </p>

          <div className="pull-quote">
            <p className="pull-quote__text">
              AI is used here not to replace analytical judgment but to
              make consistent application of a documented methodology
              tractable at a scale that would otherwise be impossible
              for a single researcher.
            </p>
          </div>

          <p>
            The specific model used is Anthropic's Claude Sonnet, accessed
            via the Anthropic API. Each organization is scored in a separate
            API call using a system prompt containing the full V4.0
            methodology, calibration anchor references across the scoring
            spectrum, and explicit instructions for N/A discipline,
            evenhandedness, and evidence standards. The model produces a
            structured JSON output with scores, body texts, confidence
            ratings, and source citations.
          </p>

          <hr className="rule" />

          <div className="section__label">What the AI Does Well</div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {[
              {
                heading: 'Consistent application of the framework',
                body: 'Applied the same ten criteria to the most recent organization with the same care and attention as the first. Human researchers drift — fatigue, changing intuitions, evolving interpretations of edge cases. The AI applies the documented methodology consistently because it has no memory of previous sessions and no accumulated fatigue. Each assessment starts fresh against the same standard.',
              },
              {
                heading: 'Cross-ideological evenhandedness',
                body: 'A human researcher assessing both MAGA and Antifa, both the Black Church and the Southern Baptist Convention, both the NAACP and the Heritage Foundation, will bring conscious and unconscious political judgments to each assessment regardless of effort. The AI applies the same criteria to all of them. It has no political commitments, no social circle whose reactions it is anticipating, and no career consequences attached to particular findings. The evenhandedness of the results is, in part, a product of the tool.',
              },
              {
                heading: 'Rapid synthesis of public documentation',
                body: 'The AI has broad familiarity with court records, investigative journalism, academic scholarship, regulatory findings, and institutional history across a wide range of organizations. It can quickly identify which documented behaviors are relevant to each criterion and construct evidence-based body text with source citations. A human researcher would spend hours on each organization doing the same initial synthesis.',
              },
              {
                heading: 'Structured, auditable output',
                body: 'Every AI-generated assessment produces a complete structured record: scores, body text, confidence ratings, sources, and calculated composite metrics. This makes the human review process tractable — the reviewer is checking a complete record against documented standards, not filling in gaps or reconstructing reasoning.',
              },
              {
                heading: 'Calibration anchor consistency',
                body: 'The system prompt includes reference anchors across the full scoring spectrum — from 100% Super Culty to 5% Not Culty. This gives the model a comparative reference frame that helps prevent score inflation or compression over large batches. The anchors are drawn directly from the database and updated when methodology changes.',
              },
            ].map((item, i) => (
              <div key={i} style={{
                borderLeft: '2px solid rgba(200,168,75,0.3)',
                paddingLeft: '1.75rem',
                paddingBottom: '1.75rem',
                marginBottom: '0.25rem',
              }}>
                <p style={{fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--paper)', marginBottom: '0.5rem'}}>{item.heading}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0}}>{item.body}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">The Tradeoffs and Risks</div>

          <p style={{color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
            These are documented honestly, not minimized.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {[
              {
                heading: 'The model does not know what it does not know',
                body: "AI confidence does not reliably track evidence quality. The model may produce a well-structured, internally consistent assessment for an organization with thin public documentation — and that assessment will look identical in form to one backed by extensive court records and investigative journalism. The confidence ratings in each entry are designed to surface this, but they are themselves AI-generated and subject to the same limitation. This is why the human reviewer must independently assess source quality, not just accept the model's confidence rating.",
              },
              {
                heading: 'Training data cutoff and recency',
                body: "The model's knowledge has a training cutoff. Organizations that have changed significantly — through scandals, leadership transitions, policy reversals, or membership collapse — may be assessed based on outdated information. Trajectory assessments (Escalating / Stable / Declining / Defunct) are particularly vulnerable to this. The human review process includes checking for major post-training developments, but this is not systematic across all entries.",
              },
              {
                heading: 'Pattern matching versus genuine understanding',
                body: "The model applies the methodology through pattern recognition against its training data. For organizations that appear frequently in public discourse, this works well. For organizations that are underrepresented in English-language text — smaller regional movements, less-covered religious formations, non-English-origin organizations — the model may produce thinner, less reliable assessments. Low confidence ratings in these entries reflect this, but the limitation is worth stating directly.",
              },
              {
                heading: 'Systematic bias in the training data',
                body: "If the corpus on which the model was trained over- or under-represents certain types of organizations, certain political formations, or certain ideological perspectives, those biases may appear in the assessments. The evenhandedness of the methodology is designed to catch gross asymmetries, but subtle systematic biases in how the model characterizes different types of organizations are difficult to detect and may not surface through the review process. This is the most difficult risk to quantify.",
              },
              {
                heading: 'The reviewer is also a person',
                body: "The human review gate is only as good as the reviewer applying it. The reviewer brings their own knowledge gaps, time constraints, and potential blind spots to every assessment. The methodology documents what the review is supposed to check. Whether that check is consistently executed is a function of the reviewer's discipline and time — not a guarantee built into the system.",
              },
              {
                heading: 'Source citation quality',
                body: "The model cites sources but cannot verify that those sources say what it claims they say, that the sources still exist at the cited URLs, or that the sources have not been updated or retracted since training. Source citations in AI-generated assessments should be independently verified before being relied upon for consequential purposes. The human review process checks that cited sources are plausible and consistent with the body text, but does not systematically verify every citation.",
              },
            ].map((item, i) => (
              <div key={i} style={{
                borderLeft: '2px solid rgba(139,32,32,0.4)',
                paddingLeft: '1.75rem',
                paddingBottom: '1.75rem',
                marginBottom: '0.25rem',
              }}>
                <p style={{fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--paper)', marginBottom: '0.5rem'}}>{item.heading}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0}}>{item.body}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">The Human Review Gate</div>

          <p>
            Every AI-generated assessment passes through human review before
            entering the published dataset. The review is not a rubber stamp.
            It is a structured check against the methodology.
          </p>

          <p>The reviewer verifies:</p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0', margin: '1.25rem 0 1.75rem'}}>
            {[
              'Each score is consistent with the body text — if the body text describes structural absence, the score must be N/A, not a floor number',
              'N/A designations have documented structural rationale, not just low evidence',
              'Cited sources are plausible and consistent with the claims made in the body text',
              'The assessment reflects consistent application across the ideological and cultural spectrum — a comparable organization on the other side of the political spectrum would be scored the same way',
              'Confidence ratings reflect actual evidence quality, not just structural completeness of the output',
              'The composite score matches the formula exactly given the criterion scores',
              "Young's Original Score was derived from independent application of the binary checklist, not mechanically from composite intensity",
              'The trajectory assessment reflects documented current state, not just historical reputation',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', padding: '0.7rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'flex-start',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--gold)', marginTop: '0.2rem', flexShrink: 0}}>—</div>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6}}>{item}</p>
              </div>
            ))}
          </div>

          <p>
            Assessments that fail the review are returned for revision or
            rejected entirely. Accepted assessments are logged in an
            immutable audit trail with timestamp, methodology version, and
            reviewer notation. Score changes after initial acceptance are
            also logged — the full history of every score in the dataset
            is preserved and traceable.
          </p>

          <hr className="rule" />

          <div className="section__label">What This Means for How You Use the Dataset</div>

          <p>
            The AI-assisted methodology produces assessments that are more
            consistent and more comprehensive than a single researcher could
            produce manually. It also introduces risks that a purely manual
            process would not have in the same form.
          </p>

          <p>
            The appropriate use of this dataset is as a research resource
            and analytical tool — a structured starting point for investigation,
            not a final determination. High composite scores document
            institutional architecture worth examining. They are not
            verdicts. Low scores do not certify institutional health.
            Every entry should be read with the understanding that it
            represents a human-reviewed AI assessment anchored to publicly
            available documentation, produced under a documented methodology,
            at a specific point in time.
          </p>

          <div style={{
            background: 'rgba(244,240,232,0.03)',
            border: '1px solid rgba(212,206,196,0.15)',
            padding: '2rem',
            marginTop: '2rem',
          }}>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '0.7rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--gold)', marginBottom: '0.75rem',
            }}>Model and Version</p>
            <p style={{fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem'}}>
              Current scoring model: <span style={{color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: '0.85rem'}}>claude-sonnet-4-6</span> (Anthropic)
            </p>
            <p style={{fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem'}}>
              Methodology version applied: <span style={{color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: '0.85rem'}}>V4.0</span>
            </p>
            <p style={{fontSize: '0.9rem', color: 'var(--muted)', margin: 0}}>
              All accepted scores are version-tagged in the audit log.
              Score history is immutable — no accepted score can be
              modified or deleted, only superseded by a new accepted score
              with documented rationale.
            </p>
          </div>

          <div style={{marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Link href="/oci/methodology" className="btn-primary">Full Methodology</Link>
            <Link href="/oci/findings" className="btn-secondary">See the Findings</Link>
          </div>

        </div>
      </section>
    </>
  );
}
