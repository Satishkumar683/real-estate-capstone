import PropertyCard from '@/features/property-search/PropertyCard';

export default function FeaturedProperties({ listings, cityLabel }) {
  if (!listings || listings.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display font-semibold text-navy text-2xl">Featured Properties</h2>
        {cityLabel && <span className="text-sm text-charcoal">in {cityLabel}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <PropertyCard key={listing.prop_id} listing={listing} cityLabel={cityLabel} />
        ))}
      </div>
    </section>
  );
}