import { redirect } from 'next/navigation';

export default function DashboardRoot() {
  // 🔀 Redirects /dashboard -> /dashboard/business
  redirect('/dashboard/business');
}