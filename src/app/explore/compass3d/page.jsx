import Compass3DWrapper from './Compass3DWrapper';

export const metadata = {
  title: '3D Political Compass — The Cultiness Spectrum',
  description: 'Three-dimensional visualization of organizations plotted by economic axis, authority axis, and composite cultiness score.',
};

export default function Compass3DPage() {
  return <Compass3DWrapper />;
}
