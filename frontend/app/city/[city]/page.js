import { notFound } from 'next/navigation';
import { fetchFromMlService } from '@/shared/api/serverClient';
import CityHubCard from '@/features/city-hub/CityHubCard';

export default async function CityHubPage({ params }) {
  const { city } = await params;
  const cities = await fetchFromMlService('/cities').catch(() => []);
  const cityInfo = cities.find((c) => c.slug === city);

  if (!cityInfo) {
    notFound();
  }

  const cards = [
    {
      title: 'Property Recommendation',
      description: 'Browse ranked listings matched to your budget, BHK, and furnishing preferences.',
      stat: `${cityInfo.count.toLocaleString('en-IN')} listings available`,
      href: `/search/${city}`,
    },
    {
      title: 'Price Estimation',
      description: "Get an instant price estimate for a property, with a breakdown of what's driving it.",
      href: `/estimate/${city}`,
    },
    {
      title: 'Market Insights',
      description: `Visual breakdown of the ${cityInfo.label} market: price distributions, hotspots, and listing trends.`,
      href: `/insights/${city}`,
    },
    {
      title: 'Luxury Score',
      description: 'See how amenities, furnishing, and location combine into a single luxury score.',
      comingSoon: true,
    },
    {
      title: 'Price Trends',
      description: 'How prices vary across property types, BHK, and localities.',
      comingSoon: true,
    },
  ];

  return (
    <main className="pt-24 max-w-6xl mx-auto px-6 pb-20">
      <p className="text-sm text-gold font-medium mb-2">{cityInfo.label}</p>
      <h1 className="font-display font-semibold text-navy text-3xl md:text-4xl">
        Everything about {cityInfo.label} real estate, in one place.
      </h1>
      <p className="mt-3 text-charcoal max-w-xl">
        {cityInfo.count.toLocaleString('en-IN')} listings, one price model, five ways to explore the market.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <CityHubCard key={card.title} {...card} />
        ))}
      </div>
    </main>
  );
}