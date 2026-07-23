import { notFound } from 'next/navigation';
import { fetchFromMlService } from '@/shared/api/serverClient';
import PriceBoxPlot from '@/features/insights/PriceBoxPlot';
import PriceAreaScatter from '@/features/insights/PriceAreaScatter';
import GeoScatterMap from '@/features/insights/GeoScatterMap';
import DistributionPie from '@/features/insights/DistributionPie';
import AmenityWordCloud from '@/features/insights/AmenityWordCloud';

function ChartCard({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-display font-semibold text-navy text-lg">{title}</h2>
      {description && <p className="text-sm text-charcoal mt-1">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function InsightsPage({ params }) {
  const { city } = await params;
  const cities = await fetchFromMlService('/cities').catch(() => []);
  const cityInfo = cities.find((c) => c.slug === city);
  if (!cityInfo) notFound();

  const analytics = await fetchFromMlService(`/${city}/analytics`).catch(() => null);
  if (!analytics) notFound();

  return (
    <main className="pt-24 max-w-6xl mx-auto px-6 pb-20">
      <p className="text-sm text-gold font-medium mb-2">{cityInfo.label}</p>
      <h1 className="font-display font-semibold text-navy text-3xl md:text-4xl">Market Insights</h1>
      <p className="mt-3 text-charcoal max-w-xl">
        Visual patterns across {analytics.total_listings.toLocaleString('en-IN')} {cityInfo.label} listings.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Price by Property Type"
          description="Distribution of sale price (Cr) across property types -- box shows the middle 50%, whiskers show the typical range."
        >
          <PriceBoxPlot data={analytics.price_by_property_type} />
        </ChartCard>

        <ChartCard title="Price vs. Area" description="Each point is one listing.">
          <PriceAreaScatter data={analytics.price_vs_area_sample} />
        </ChartCard>

        <ChartCard
          title="Where Listings Are"
          description="Plotted by coordinates, colored by price tier -- a lightweight map without needing a tile server."
        >
          <GeoScatterMap data={analytics.geo_points} />
        </ChartCard>

        <ChartCard title="Property Type Mix">
          <DistributionPie data={analytics.property_type_distribution} />
        </ChartCard>

        <ChartCard title="Furnishing Mix">
          <DistributionPie data={analytics.furnish_distribution} />
        </ChartCard>

        <ChartCard
          title="What Listings Mention"
          description="Word frequency mined from real listing descriptions -- bigger means mentioned more often."
        >
          <AmenityWordCloud data={analytics.word_cloud} />
        </ChartCard>
      </div>
    </main>
  );
}