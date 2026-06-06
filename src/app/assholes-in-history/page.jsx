export const metadata = {
  title: 'Assholes in History',
  description: 'A Comprehensive Survey of Catastrophic Leadership, Spectacular Ego, and the Recurring Human Failure to Say Temper, Temper — by Zachary S. Mays.',
};

const SUBJECTS = [
  // The Incompetent
  { name: 'Zhengde Emperor', section: 'The Incompetent', note: 'Built a zoo to avoid governing' },
  { name: 'King John', section: 'The Incompetent', note: 'Lost the Crown Jewels in a tidal estuary' },
  { name: 'Kaiser Wilhelm II', section: 'The Incompetent', note: 'One interview, four alienated powers' },
  { name: 'Edward II', section: 'The Incompetent', note: 'Lost Scotland. His wife handled the rest.' },
  { name: 'Henry VI', section: 'The Incompetent', note: 'Crowned at nine months. Lost France by thirty-one.' },
  { name: 'Richard II', section: 'The Incompetent', note: 'Briefly surprised by what happened next' },
  // The Cruel
  { name: 'Vlad the Impaler', section: 'The Cruel', note: '20,000 bodies. The Ottomans went home.' },
  { name: 'Charles the Bad', section: 'The Cruel', note: 'The physicians handled it.' },
  { name: 'Ranavalona I', section: 'The Cruel', note: 'Buffalo hunt. No buffalo.' },
  { name: 'Ivan the Terrible', section: 'The Cruel', note: 'Rang the bells for his own dead' },
  { name: 'Torquemada', section: 'The Cruel', note: 'Found the sessions satisfactory' },
  { name: 'Pope Alexander VI', section: 'The Cruel', note: 'Machiavelli took notes.' },
  // The Vain
  { name: 'Nero', section: 'The Vain', note: 'The boat failed. The assassins improved on it.' },
  { name: 'Commodus', section: 'The Vain', note: 'Renamed Rome, the months, and himself' },
  { name: 'Xerxes', section: 'The Vain', note: 'Flogged the ocean. The ocean did not apologize.' },
  { name: 'Henry VIII', section: 'The Vain', note: 'Invented a religion. Kept the title.' },
  { name: 'Empress Dowager Cixi', section: 'The Vain', note: 'The boat is marble. It has not moved.' },
  { name: 'Caligula', section: 'The Vain', note: 'The reason this book exists' },
  // The Just Plain Weird
  { name: 'Ludwig II', section: 'The Just Plain Weird', note: 'Bankrupted Bavaria. It worked out.' },
  { name: 'Muhammad Shah Rangeela', section: 'The Just Plain Weird', note: 'Continued entertainments the same week' },
  { name: 'Ibrahim the Mad', section: 'The Just Plain Weird', note: 'The cage leaves marks.' },
  { name: 'King James I & VI', section: 'The Just Plain Weird', note: 'Weather control and scripture. Both serious.' },
  { name: 'Qin Shi Huang', section: 'The Just Plain Weird', note: 'Unified China. Drank mercury. The door has not opened.' },
];

const SECTIONS = ['The Incompetent', 'The Cruel', 'The Vain', 'The Just Plain Weird'];

export default function AssholesPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            Temper Temper Publications
          </span>
          <h1 className="hero__title animate-up-2">
            <span style={{display:'block', color:'var(--accent)'}}>Assholes</span>
            <span style={{display:'block'}}>in History</span>
          </h1>
          <p className="hero__subtitle animate-up-3">
            A Comprehensive Survey of Catastrophic Leadership, Spectacular Ego,
            and the Recurring Human Failure to Say Temper, Temper
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">The Book</div>

          <p style={{fontSize: '1.1rem', color: 'var(--cream)', lineHeight: 1.8}}>
            History has a pattern.
          </p>

          <p>
            It runs through Rome and China and Russia and Madagascar and the Ottoman
            Empire and medieval England and the Mughal court and the Central African
            Republic. It runs through empires that lasted a thousand years and
            dynasties that lasted fifteen. It runs through men who declared war on
            the ocean and women who redirected the Imperial Navy budget to build a
            boat made of marble.
          </p>

          <div style={{
            background: 'rgba(139,32,32,0.08)',
            border: '1px solid rgba(139,32,32,0.25)',
            padding: '1.5rem 2rem',
            margin: '2rem 0',
            fontFamily: 'var(--mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
            color: 'var(--muted)',
          }}>
            The boat cannot move. It has not moved. It will never move.
          </div>

          <p>
            The pattern is not that power corrupts. That's the polite version.
            The accurate version is that power, in the complete absence of anyone
            capable of saying no, produces results that are remarkably consistent
            across four thousand years of recorded human behavior. The results are
            catastrophic. They are also, on reflection, extremely funny.
          </p>

          <p>
            <em>Assholes in History</em> examines twenty-three of history's most
            spectacularly awful rulers — not as monsters dropped into the record
            from elsewhere, but as products. Of dynasties, courts, theological
            systems, fathers who destroyed them, empires that had no mechanism
            for telling the truth to power, and cultures that had decided,
            sometimes across generations, that a particular kind of person was
            exactly what they needed.
          </p>

          <p>They were wrong. History kept excellent records about how wrong they were.</p>

          <hr className="rule" />

          <div className="section__label">The Argument</div>

          <p>
            The USS Wisconsin, off the coast of Korea, had the misfortune of being
            fired upon by land-based artillery. She responded by removing the terrain
            feature from the map. A nearby ship radioed two words:{' '}
            <em style={{color: 'var(--gold)'}}>temper, temper.</em>
          </p>

          <p>
            Caligula marched the greatest military force in human history to the
            English Channel, declared war on the ocean, sent his soldiers in with
            swords, collected the seashells as spoils of war, mailed them back to
            Rome, and demanded a triumph. The Senate, having considered its options,
            provided one.
          </p>

          <div className="pull-quote">
            <p className="pull-quote__text">
              Two of these stories worked out. What separated the Wisconsin from
              Caligula was not the audacity. It was whether anyone was capable
              of saying those two words.
            </p>
          </div>

          <p>
            Nobody said them to Caligula. About anything. Ever.
          </p>

          <hr className="rule" />

          <div className="section__label">The Caligula Test</div>

          <p>Not every tyrant qualifies. Admission to this book requires passing:</p>

          <div style={{margin: '2rem 0'}}>
            {[
              { label: 'Scale', text: 'Consequences proportional to the power behind them. This is not a local eccentric.' },
              { label: 'Commitment', text: 'He was not confused about what he was doing. He knew. He proceeded.' },
              { label: 'Audacity', text: 'The gap between the action and any reasonable human response must be large enough to constitute the joke.' },
              { label: 'Irony', text: 'The systems meant to constrain these figures produced or enabled them instead. Rome produced Caligula. The Senate watched. The machinery of the most powerful state on earth processed his instructions and executed them — including, eventually, him.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(212,206,196,0.1)',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  paddingTop: '0.2rem'
                }}>{item.label}</div>
                <p style={{color: 'var(--muted)', fontSize: '0.95rem', margin: 0}}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">The Subjects</div>

          <p style={{marginBottom: '2rem', color: 'var(--muted)'}}>
            Twenty-three rulers, organized across four sections.
          </p>

          {SECTIONS.map(section => (
            <div key={section} style={{marginBottom: '3rem'}}>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                fontWeight: 700,
                color: 'var(--paper)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(212,206,196,0.15)'
              }}>
                {section}
              </p>
              <div className="subject-grid">
                {SUBJECTS.filter(s => s.section === section).map(subj => (
                  <div key={subj.name} className="subject-item">
                    <div className="subject-item__name">{subj.name}</div>
                    <div className="subject-item__note">{subj.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <hr className="rule" />

          <div className="section__label">The Voice</div>

          <p>
            A practical guide to evaluating what leaders actually mean — not what
            they say. Suetonius meets Oscar Wilde. The narrator is never shocked. Never
            horrified. Merely observant. Flat affect, precise detail, humor that
            lives in the architecture of the sentence rather than in anything the
            narrator is trying to do. The cruelty and the absurdity arrive in the
            same administrative tone, because the historical record delivered them
            the same way.
          </p>

          <div className="pull-quote">
            <p className="pull-quote__text">
              The scary part is not that they were monsters. The scary part is
              how familiar the pattern is.
            </p>
          </div>

          <p>
            The book is not a counsel of despair. It is an observation — delivered
            with the composure of a man who has looked at four thousand years of
            recorded human behavior and found it, on balance, darkly hilarious —
            that the machinery that produced these people was entirely human. And
            that in several cases, variations of that machinery are running
            somewhere right now.
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
              marginBottom: '0.75rem'
            }}>Forthcoming — Temper Temper Publications</p>
            <p style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.1rem',
              fontStyle: 'italic',
              color: 'var(--paper)',
              margin: 0
            }}>
              Publication details to be announced.
            </p>
          </div>

          {/* TODO(substack): replace href with the real Substack URL when available. */}
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.78rem',
            letterSpacing: '0.05em',
            color: 'var(--muted)',
            textAlign: 'center',
            marginTop: '1.5rem'
          }}>
            <a href="#substack-todo">Follow on Substack for updates.</a>
          </p>
        </div>
      </section>
    </>
  );
}
