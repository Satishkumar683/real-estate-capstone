import { redirect } from 'next/navigation';
import { fetchFromMlService } from '@/shared/api/serverClient';

// Nav links point here (no city known yet) -- redirect to whichever city loads
// first. Once there's a "last visited city" preference (e.g. via a cookie),
// this is the place to use it instead of always picking the first one.
export default async function SearchIndexPage() {
  const cities = await fetchFromMlService('/cities').catch(() => []);
  if (cities.length > 0) {
    redirect(`/search/${cities[0].slug}`);
  }
  return (
    <main className="pt-24 max-w-xl mx-auto px-6 pb-20 text-center">
      <p className="text-charcoal">No cities are live yet.</p>
    </main>
  );
}