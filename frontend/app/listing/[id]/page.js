import Link from 'next/link';
import { fetchFromMlService } from '@/shared/api/serverClient';
import { formatINR, formatArea, formatPricePerSqft, getValueBadge } from '@/shared/lib/format';
import Badge from '@/shared/ui/Badge';
import Button from '@/shared/ui/Button';
import PropertyCard from '@/features/property-search/PropertyCard';
import ImageGallery from '@/features/listing-detail/ImageGallery';

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const { city } = (await searchParams) || {};
  const listing = await fetchFromMlService(city ? `/${city}/listing/${id}` : `/listing/${id}`).catch(() => null);

  if (!listing) {
    return { title: 'Listing Not Found | RealEstateAI' };
  }

  const title = listing.prop_heading || `${listing.bhk} BHK ${listing.property_type} in ${listing.locality}`;
  return {
    title: `${title} | RealEstateAI`,
    description: listing.description ? listing.description.slice(0, 160) : `View verified details and AI valuation for ${title}.`,
  };
}

export default async function ListingDetailPage({ params, searchParams }) {
  const { id } = await params;
  const { city } = (await searchParams) || {};

  const listing = await fetchFromMlService(
    city ? `/${city}/listing/${id}` : `/listing/${id}`
  ).catch(() => null);

  if (!listing) {
    return (
      <main className="pt-32 pb-24 max-w-4xl mx-auto px-6 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-12 border border-navy/10">
          <p className="text-gold font-medium text-sm mb-2">Listing Not Found</p>
          <h1 className="font-display font-semibold text-navy text-3xl">
            We couldn&apos;t find this property
          </h1>
          <p className="text-charcoal mt-3 max-w-md mx-auto text-sm leading-relaxed">
            The listing with ID <code className="bg-beige px-1.5 py-0.5 rounded text-navy font-mono text-xs">{id}</code> may have been archived or does not exist in our active dataset.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/" className="inline-block">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link href="/search" className="inline-block">
              <Button variant="primary">Browse Listings</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const badge = getValueBadge(listing.value_score);
  const title = listing.prop_heading || (listing.society_name && listing.society_name !== 'Unknown'
    ? `${listing.society_name} — ${listing.bhk} BHK ${listing.property_type}`
    : `${listing.bhk} BHK ${listing.property_type} in ${listing.locality}`);

  const citySlug = listing.city || city || 'gurgaon';
  const cityDisplayName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const pricePerSqft = listing.area_sqft ? listing.price / listing.area_sqft : null;
  const predPerSqft = listing.area_sqft ? listing.predicted_price / listing.area_sqft : null;

  const diffPct = Math.round(listing.value_score * 100);
  let valuationTone = 'neutral';
  let valuationSummary = 'This property is priced on par with comparable market listings.';
  if (diffPct >= 3) {
    valuationTone = 'good';
    valuationSummary = `Listed at approximately ${diffPct}% below the AI model's benchmark valuation — representing attractive buyer value.`;
  } else if (diffPct <= -3) {
    valuationTone = 'bad';
    valuationSummary = `Listed at ${Math.abs(diffPct)}% above the typical model valuation, likely reflecting seller premium or special unit upgrades.`;
  }

  const specs = [
    { label: 'Configuration', value: `${listing.bhk} BHK` },
    { label: 'Bathrooms', value: listing.bathroom_num ? `${listing.bathroom_num}` : '—' },
    { label: 'Balconies', value: listing.balcony_num != null ? `${listing.balcony_num}` : '—' },
    { label: 'Super Built-up Area', value: listing.superbuiltup_sqft ? formatArea(listing.superbuiltup_sqft) : formatArea(listing.area_sqft) },
    { label: 'Carpet Area', value: listing.carpet_sqft ? formatArea(listing.carpet_sqft) : '—' },
    {
      label: 'Floor',
      value: listing.floor_num != null && listing.total_floor != null
        ? `${listing.floor_num} of ${listing.total_floor} floors`
        : listing.floor_num != null ? `Floor ${listing.floor_num}` : '—',
    },
    { label: 'Facing', value: listing.facing_text || '—' },
    { label: 'Furnishing', value: listing.furnish || '—' },
    { label: 'Possession Status', value: listing.is_ready_to_move ? 'Ready to Move' : 'Under Construction' },
    { label: 'Transaction Type', value: listing.is_resale ? 'Resale' : 'New / Developer' },
    { label: 'Gated Community', value: listing.is_gated_community ? 'Yes (Gated)' : 'No' },
    { label: 'RERA Approved', value: listing.is_rera ? 'Yes (Verified)' : 'Not Available' },
    { label: 'Luxury Index', value: `${listing.luxury_score} / 50` },
    { label: 'Distance to Center', value: `${listing.dist_from_center_km.toFixed(1)} km` },
  ];

  const landmarks = Object.entries(listing.nearby_landmarks || {});

  return (
    <main className="pt-24 pb-20 max-w-6xl mx-auto px-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-charcoal flex items-center gap-2 mb-6">
        <Link href="/" className="hover:text-navy transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/city/${citySlug}`} className="hover:text-navy transition-colors">{cityDisplayName}</Link>
        <span>/</span>
        <Link href={`/search/${citySlug}`} className="hover:text-navy transition-colors">Search</Link>
        <span>/</span>
        <span className="text-navy font-medium truncate max-w-xs">{listing.prop_id}</span>
      </nav>

      {/* Main Header / Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-navy/10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-1 rounded-md">
              {listing.property_type}
            </span>
            {listing.furnish && (
              <span className="text-xs text-charcoal border border-navy/15 rounded-md px-2.5 py-1">
                {listing.furnish}
              </span>
            )}
            {listing.is_gated_community && (
              <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
                Gated Society
              </span>
            )}
          </div>
          <h1 className="font-display font-semibold text-navy text-2xl md:text-3xl mt-2.5 leading-snug">
            {title}
          </h1>
          <p className="text-sm text-charcoal mt-1">
            {listing.society_name && listing.society_name !== 'Unknown' ? `${listing.society_name}, ` : ''}
            {listing.locality}, {cityDisplayName}
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <p className="text-xs text-charcoal">Asking Price</p>
          <p className="font-display font-semibold text-navy text-3xl">
            {formatINR(listing.price)}
          </p>
          <p className="text-xs text-charcoal mt-0.5">
            {formatPricePerSqft(pricePerSqft)}
          </p>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Media & Deep Details */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Gallery */}
          <ImageGallery images={listing.images} title={title} badge={badge} />

          {/* AI Valuation & Fair Value Insight Card */}
          <section className="bg-gradient-to-br from-white to-beige/40 rounded-2xl p-6 shadow-sm border border-champagne/60">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                <h2 className="font-display font-semibold text-navy text-lg">
                  AI Fair-Value Valuation
                </h2>
              </div>
              <Badge tone={badge.tone} className="shadow-xs text-xs font-semibold">
                {badge.label}
              </Badge>
            </div>

            <p className="text-sm text-charcoal mt-2 leading-relaxed">
              {valuationSummary}
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-navy/10 text-center sm:text-left">
              <div className="bg-white/80 p-3.5 rounded-xl border border-navy/5">
                <p className="text-xs text-charcoal/80">Asking Price</p>
                <p className="font-semibold text-navy text-lg mt-0.5">{formatINR(listing.price)}</p>
                <p className="text-[11px] text-charcoal mt-0.5">{formatPricePerSqft(pricePerSqft)}</p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-navy/5">
                <p className="text-xs text-charcoal/80">AI Model Fair Value</p>
                <p className="font-semibold text-gold text-lg mt-0.5">{formatINR(listing.predicted_price)}</p>
                <p className="text-[11px] text-charcoal mt-0.5">{formatPricePerSqft(predPerSqft)}</p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-navy/5">
                <p className="text-xs text-charcoal/80">Pricing Delta</p>
                <p className={`font-semibold text-lg mt-0.5 ${diffPct >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {diffPct > 0 ? `-${diffPct}% Underpriced` : diffPct < 0 ? `+${Math.abs(diffPct)}% Premium` : '0% Fair Market'}
                </p>
                <p className="text-[11px] text-charcoal mt-0.5">XGBoost ($R^2 \approx 0.90$)</p>
              </div>
            </div>

            <p className="text-[11px] text-charcoal/70 mt-4 leading-normal">
              Valuation generated using our calibrated machine learning regressor evaluating {listing.area_sqft} sqft, {listing.locality} submarket baselines, floor level, and luxury indices.
            </p>
          </section>

          {/* Core Specifications */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-navy/10">
            <h2 className="font-display font-semibold text-navy text-xl mb-4">
              Property Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
              {specs.map((item) => (
                <div key={item.label} className="border-b border-navy/5 pb-2.5">
                  <p className="text-xs text-charcoal/70">{item.label}</p>
                  <p className="font-medium text-navy text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Neighborhood & Connectivity */}
          {landmarks.length > 0 && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-navy/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-navy text-xl">
                  Neighborhood Landmarks & Connectivity
                </h2>
                <span className="text-xs text-gold font-medium bg-gold/10 px-2 py-0.5 rounded">
                  {listing.total_nearby_landmarks || landmarks.length} Listed
                </span>
              </div>
              <p className="text-sm text-charcoal mb-4">
                Key points of interest within close radius of this society:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {landmarks.map(([name, count]) => (
                  <div key={name} className="bg-cream/60 p-3 rounded-xl border border-navy/5 text-center">
                    <p className="font-display font-semibold text-navy text-xl">{count}</p>
                    <p className="text-xs text-charcoal mt-0.5">{name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          {listing.description && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-navy/10">
              <h2 className="font-display font-semibold text-navy text-xl mb-3">
                About this Listing
              </h2>
              <div className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>
            </section>
          )}
        </div>

        {/* Right Sticky Column: Contact & Action Card */}
        <div className="lg:col-span-1 lg:sticky lg:top-28 flex flex-col gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy/10">
            <p className="text-xs text-charcoal uppercase tracking-wider font-semibold">Verified Listing</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-display font-bold text-navy text-3xl">
                {formatINR(listing.price)}
              </span>
              <span className="text-xs text-charcoal">
                {formatPricePerSqft(pricePerSqft)}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-navy/10 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-charcoal">
                <span>Property ID</span>
                <span className="font-mono text-navy font-medium">{listing.prop_id}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-charcoal">
                <span>Locality</span>
                <span className="text-navy font-medium">{listing.locality}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-charcoal">
                <span>Valuation Badge</span>
                <Badge tone={badge.tone} className="text-[11px] py-0.5">
                  {badge.label}
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="primary"
                className="w-full text-center py-3.5 shadow-sm"
                onClick={undefined}
              >
                Schedule a Visit
              </Button>
              <Button
                variant="outline"
                className="w-full text-center py-3.5"
                onClick={undefined}
              >
                Contact Broker / Owner
              </Button>
            </div>

            <div className="mt-6 pt-5 border-t border-navy/10 flex flex-col gap-2.5 text-xs text-charcoal/80">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Direct pricing verification via 99acres</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Model evaluation ($R^2 \approx 0.90$) applied</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Zero brokerage on select verified flats</span>
              </div>
            </div>
          </div>

          {/* Quick Locality Card */}
          <div className="bg-beige/60 rounded-2xl p-5 border border-navy/10 text-xs text-charcoal">
            <p className="font-semibold text-navy text-sm mb-1">{cityDisplayName} Market Insights</p>
            <p className="leading-relaxed">
              Want to see average price trends and locality distributions for {cityDisplayName}?
            </p>
            <Link
              href={`/insights/${citySlug}`}
              className="mt-3 inline-flex items-center gap-1 font-medium text-gold hover:underline"
            >
              Explore {cityDisplayName} Market Insights &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Similar Listings Section */}
      {listing.similar_listings && listing.similar_listings.length > 0 && (
        <section className="mt-16 pt-12 border-t border-navy/10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-gold uppercase tracking-wider font-semibold">Recommendations</p>
              <h2 className="font-display font-semibold text-navy text-2xl md:text-3xl mt-1">
                Similar Properties in {listing.locality}
              </h2>
            </div>
            <Link
              href={`/search/${citySlug}`}
              className="text-sm font-medium text-gold hover:underline hidden sm:inline"
            >
              Browse all {cityDisplayName} listings &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listing.similar_listings.map((simListing) => (
              <PropertyCard
                key={simListing.prop_id}
                listing={simListing}
                cityLabel={cityDisplayName}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
