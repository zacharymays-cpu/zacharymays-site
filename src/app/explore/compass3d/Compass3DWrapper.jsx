'use client';
import dynamic from 'next/dynamic';
const Compass3DClient = dynamic(() => import('./Compass3DClient'), { ssr: false });
export default function Compass3DWrapper(props) { return <Compass3DClient {...props} />; }
