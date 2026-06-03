import dynamic from 'next/dynamic';
import Link from 'next/link';

export const metadata = {
  title: '3D Political Compass — The Cultiness Spectrum',
  description: 'Three-dimensional visualization of organizations plotted by economic axis, authority axis, and composite cultiness score.',
};

const Compass3DClient = dynamic(() => import('./Compass3DClient'), { ssr: false });

export default function Compass3DPage() {
  return <Compass3DClient />;
}
