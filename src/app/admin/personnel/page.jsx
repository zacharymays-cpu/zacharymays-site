// Personnel root page: redirect to roster tab
import { redirect } from 'next/navigation';

export default function PersonnelRoot() {
  redirect('/admin/personnel/roster');
}
