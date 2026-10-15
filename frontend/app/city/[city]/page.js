import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchFromMlService } from '@/shared/api/serverClient';
import CityHubCard from '@/features/city-hub/CityHubCard';

export default async function CityHubPage({ params }) {
  const { city } = await params;
  const cities = await fetchFromMlService('/cities').catch(() => []);
  const cityInfo =
    cities.find((c) => c.slug === city) ||
    (city === 'gurgaon' ? { slug: 'gurgaon', label: 'Gurgaon', count: 7884 } : null);

  if (!cityInfo) {
    notFound();
  }

  const cards = [
    {
      title: 'Property Search & Ranking',
      description: 'Browse ranked listings matched to your budget, BHK, and furnishing preferences with value scores.',
      stat: `${cityInfo.count.toLocaleString('en-IN')} listings`,
      href: `/search/${city}`,
    },
    {
      title: 'Property Valuation & Price Drivers',
      description: "Get an instant valuation for any property in this market, with a transparent breakdown of what drives the price.",
      stat: 'Instant Valuation',
      href: `/estimate/${city}`,
    },
    {
      title: 'Market Insights & Visuals',
      description: `Visual breakdown of the ${cityInfo.label} market: price distributions, locality rankings, and scatter maps.`,
      stat: 'Interactive Visuals',
      href: `/insights/${city}`,
    },
    {
      title: 'Luxury Score',
      description: 'See how amenities, furnishing, and locality combine into a single luxury index.',
      comingSoon: true,
    },
    {
      title: 'Price Trends Over Time',
      description: 'Historical price variations across property types, BHK configurations, and localities.',
      comingSoon: true,
    },
  ];

  return (
    <main className="pt-28 max-w-6xl mx-auto px-6 pb-20">
      {/* Header section with Flow badges */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <span className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
          <span>✓</span>
          <span>{cityInfo.label} Metro Active</span>
        </span>
        <span className="bg-white border border-[#18181B]/15 text-[#18181B] rounded-full px-3 py-1 text-xs font-medium">
          {cityInfo.count.toLocaleString('en-IN')} Listings Analyzed
        </span>
      </div>

      <h1 className="font-display font-semibold text-[#18181B] text-3xl sm:text-4xl md:text-5xl tracking-tight">
        Everything about <span className="italic font-normal">{cityInfo.label}</span> real estate.
      </h1>
      <p className="mt-3 text-[#52525B] max-w-2xl text-base sm:text-lg leading-relaxed">
        Explore listings, get transparent fair-market valuations, and analyze neighborhood trends across {cityInfo.label}.
      </p>

      {/* Switcher for other cities */}
      {cities.length > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-[#52525B] mr-1">Switch metro:</span>
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/city/${c.slug}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                c.slug === city
                  ? 'bg-[#E8D5FF] text-[#18181B] border-[#18181B] shadow-xs'
                  : 'bg-white text-[#52525B] border-[#18181B]/15 hover:border-[#18181B]/30 hover:text-[#18181B]'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}

      {/* Grid of hub cards */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <CityHubCard key={card.title} {...card} />
        ))}
      </div>
    </main>
  );
}