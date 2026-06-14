'use client';
import dynamic from 'next/dynamic';

// maplibre-gl touches `window` at import time, so load the client map only in
// the browser (matches the /explore/map MapWrapper pattern).
const ChildrenOfGodClient = dynamic(() => import('./ChildrenOfGodClient'), { ssr: false });

export default function ChildrenOfGodWrapper(props) {
  return <ChildrenOfGodClient {...props} />;
}
