import { redirect } from 'next/navigation';

// The origins view is now the primary Formation Lineage page.
export default function OriginsRedirect() {
  redirect('/explore/lineage');
}
