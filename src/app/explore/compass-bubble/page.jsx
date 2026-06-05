import BubbleWrapper from './BubbleWrapper';
import ExploreNav from '../../../components/ExploreNav';

export const metadata = {
  title: 'Bubble Compass — The Cultiness Spectrum',
  description: 'Political compass bubble chart. Dot size encodes composite cultiness score, color encodes tier. Filter by tier to isolate patterns.',
};

export default function CompassBubblePage() {
  return (<><ExploreNav /><BubbleWrapper /></>);
}
