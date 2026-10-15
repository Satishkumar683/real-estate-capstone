import { fetchFromMlService } from '@/shared/api/serverClient';
import HeroSearch from '@/features/home/HeroSearch';

// Home is deliberately minimal: navbar (global, via layout.js) + city
// selection, nothing else. MarketSnapshot and CityGrid were removed from
// here -- MarketSnapshot.jsx and CityGrid.jsx still exist under
// features/home/ in case they're useful elsewhere later (e.g. a future
// "browse all cities" page), just not rendered on Home anymore.
const DEFAULT_CITIES = [{ slug: 'gurgaon', label: 'Gurgaon', count: 7884 }];

export default async function HomePage() {
  const fetched = await fetchFromMlService('/cities').catch(() => []);
  const cities = fetched && fetched.length > 0 ? fetched : DEFAULT_CITIES;

  return (
    <main>
      <HeroSearch cities={cities} />
    </main>
  );
}