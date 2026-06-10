import ExploreNav from '../../../components/ExploreNav';
import CultsOverTimeChart from '../../../components/CultsOverTimeChart';

export const metadata = {
  title: 'Active Over Time — The Cultiness Spectrum',
  description: 'The number of organizations (Moderate-Control or High-Control) counted as active in the United States in each year, computed live from the dataset.',
};

export const revalidate = 3600;

export default function TimelinePage() {
  return (
    <>
      <ExploreNav title="Active Over Time" />
      <div className="container--wide" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem', maxWidth: '60ch' }}>
          The number of organizations (Moderate-Control or High-Control) counted
          as active in the United States in each year. An organization is counted
          from its founding year until its recorded year of dissolution, if any.
        </p>
        <CultsOverTimeChart />
      </div>
    </>
  );
}
