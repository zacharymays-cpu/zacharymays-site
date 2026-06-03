import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Bubble Compass — The Cultiness Spectrum',
  description: 'Political compass bubble chart. Dot size encodes composite cultiness score, color encodes tier. Filter by tier to isolate patterns.',
};

const BubbleClient = dynamic(() => import('./BubbleClient'), { ssr: false });

export default function CompassBubblePage() {
  return <BubbleClient />;
}
