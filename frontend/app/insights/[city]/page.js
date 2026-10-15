import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchFromMlService } from '@/shared/api/serverClient';
import PriceBoxPlot from '@/features/insights/PriceBoxPlot';
import PriceAreaScatter from '@/features/insights/PriceAreaScatter';
import GeoScatterMap from '@/features/insights/GeoScatterMap';
import DistributionPie from '@/features/insights/DistributionPie';
import AmenityWordCloud from '@/features/insights/AmenityWordCloud';

function ChartCard({ title, description, children }) {
  return (
    <div className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
      <div>
        <h2 className="font-display font-semibold text-[#18181B] text-lg">{title}</h2>
        {description && <p className="text-xs text-[#52525B] mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function InsightsPage({ params }) {
  const { city } = await params;
  const cities = await fetchFromMlService('/cities').catch(() => []);
  const cityInfo = cities.find((c) => c.slug === city) || (city === 'gurgaon' ? { slug: 'gurgaon', label: 'Gurgaon', count: 7884 } : null);
  if (!cityInfo) notFound();

  const analytics = await fetchFromMlService(`/${city}/analytics`).catch(() => null);
  if (!analytics) notFound();

  return (
    <main className="min-h-screen bg-[#FAF8EE] pt-28 max-w-6xl mx-auto px-6 pb-20">
      {/* Flow badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
          <span>✓</span>
          <span>{cityInfo.label} Market Intelligence</span>
        </span>
        <span className="bg-white border border-[#18181B]/15 text-[#18181B] rounded-full px-3 py-1 text-xs font-medium">
          {analytics.total_listings.toLocaleString('en-IN')} Listings Visualized
        </span>
      </div>

      <h1 className="font-display font-semibold text-[#18181B] text-3xl sm:text-4xl md:text-5xl tracking-tight">
        {cityInfo.label} <span className="italic font-normal">Market Insights</span>
      </h1>
      <p className="mt-3 text-[#52525B] max-w-xl text-base leading-relaxed">
        Explore visual patterns, price tiers, and amenity distributions across {analytics.total_listings.toLocaleString('en-IN')} authentic market listings.
      </p>

      {/* City Switcher */}
      {cities.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#52525B]">Metro:</span>
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/insights/${c.slug}`}
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

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Price by Property Type"
          description="Distribution of sale price (Cr) across property types -- box shows the middle 50%, whiskers show the typical range."
        >
          <PriceBoxPlot data={analytics.price_by_property_type} />
        </ChartCard>

        <ChartCard title="Price vs. Area" description="Each point represents an individual verified listing.">
          <PriceAreaScatter data={analytics.price_vs_area_sample} />
        </ChartCard>

        <ChartCard
          title="Geographic Listing Distribution"
          description="Coordinates plotted and clustered by price tier across the metro area."
        >
          <GeoScatterMap data={analytics.geo_points} />
        </ChartCard>

        <ChartCard title="Property Type Mix" description="Distribution of apartments vs builder floors and houses.">
          <DistributionPie data={analytics.property_type_distribution} />
        </ChartCard>

        <ChartCard title="Furnishing Mix" description="Breakdown of furnished, semi-furnished, and unfurnished units.">
          <DistributionPie data={analytics.furnish_distribution} />
        </ChartCard>

        <ChartCard
          title="Top Mentioned Amenities"
          description="Most frequent amenities extracted from listing descriptions."
        >
          <AmenityWordCloud words={analytics.top_amenities} />
        </ChartCard>
      </div>
    </main>
  );
}