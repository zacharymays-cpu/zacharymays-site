export const metadata = {
  title: 'Terms of Use — zacharymays.com',
  description: 'Terms of use for zacharymays.com and the Cultiness Spectrum Dataset.',
}

export default function TermsPage() {
  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem', maxWidth: 760 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
        Legal
      </p>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, marginBottom: '2rem' }}>
        Terms of Use
      </h1>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', lineHeight: 1.8, color: 'rgba(244,240,232,0.75)' }}>
        <p style={{ marginBottom: '1.5rem' }}>
          Last updated: June 2026
        </p>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--paper)', marginBottom: '0.75rem', marginTop: '2.5rem' }}>Use of the Dataset</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          The Cultiness Spectrum Dataset (HWGH-v1) is made available for research, educational, and journalistic purposes. 
          All scores reflect documented institutional behaviors based on publicly verifiable sources. 
          Scores are not statements about individuals within organizations.
        </p>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--paper)', marginBottom: '0.75rem', marginTop: '2.5rem' }}>No Warranties</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          This site and dataset are provided as-is. While every effort is made to ensure accuracy, 
          no warranty is made regarding completeness or fitness for any particular purpose.
        </p>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--paper)', marginBottom: '0.75rem', marginTop: '2.5rem' }}>Attribution</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          The Young &amp; Reed Dual-Metric System is the intellectual property of Daniella Mestyanek Young and Amy Reed, 
          as published in <em>The Culting of America</em> (Otterpine, 2026). 
          Application of the framework in this dataset does not imply endorsement by Young, Reed, or Otterpine.
        </p>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--paper)', marginBottom: '0.75rem', marginTop: '2.5rem' }}>Contact</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Questions regarding use of this data may be directed through the contact information on the About page.
        </p>
      </div>
    </main>
  )
}
