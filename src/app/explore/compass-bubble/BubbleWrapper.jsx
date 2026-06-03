'use client';
import dynamic from 'next/dynamic';
const BubbleClient = dynamic(() => import('./BubbleClient'), { ssr: false });
export default function BubbleWrapper(props) { return <BubbleClient {...props} />; }
