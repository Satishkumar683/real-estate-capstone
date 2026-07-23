import { redirect } from 'next/navigation';
import { fetchFromMlService } from '@/shared/api/serverClient';

export default async function EstimateIndexPage() {
  const cities = await fetchFromMlService('/cities').catch(() => []);
  if (cities.length > 0) {
    redirect(`/estimate/${cities[0].slug}`);
  }
  return (
    <main className="pt-24 max-w-xl mx-auto px-6 pb-20 text-center">
      <p className="text-charcoal">No cities are live yet.</p>
    </main>
  );
}