'use client';

import { useState } from 'react';
import Image from 'next/image';
import Badge from '@/shared/ui/Badge';
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder';
import { formatINR, formatArea, formatPricePerSqft, getValueBadge } from '@/shared/lib/format';

export default function PropertyCard({ listing, cityLabel }) {
  const [imgFailed, setImgFailed] = useState(false);
  const badge = getValueBadge(listing.value_score);
  const pricePerSqft = listing.area_sqft ? listing.price / listing.area_sqft : null;
  const title = listing.society_name && listing.society_name !== 'Unknown'
    ? listing.society_name
    : `${listing.bhk} BHK ${listing.property_type}`;
  const showImage = listing.thumbnail_url && !imgFailed;

  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative overflow-hidden aspect-[4/3] bg-cream">
        {showImage ? (
          <Image
            src={listing.thumbnail_url}
            alt={`${listing.property_type} in ${listing.locality}, ${cityLabel || ''}`}
            fill
            unoptimized
            onError={() => setImgFailed(true)}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <ImagePlaceholder label={`${listing.bhk} BHK ${listing.property_type}`} />
        )}
        <Badge tone={badge.tone} className="absolute top-3 left-3 shadow-sm">
          {badge.label}
        </Badge>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-navy leading-snug">{title}</h3>
          {listing.furnish && (
            <span className="text-[11px] text-gold border border-gold/40 rounded-full px-2 py-0.5 whitespace-nowrap">
              {listing.furnish}
            </span>
          )}
        </div>
        <p className="text-sm text-charcoal mt-0.5">{listing.locality}{cityLabel ? `, ${cityLabel}` : ''}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-semibold text-navy">{formatINR(listing.price)}</span>
        </div>
        <p className="text-xs text-charcoal mt-1">{formatPricePerSqft(pricePerSqft)}</p>

        <div className="mt-3 flex gap-3 text-xs text-charcoal">
          <span>{listing.bhk} BHK</span>
          <span>&bull;</span>
          <span>{formatArea(listing.area_sqft)}</span>
        </div>

        <a
          href={`/listing/${listing.prop_id}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
        >
          View details &rarr;
        </a>
      </div>
    </article>
  );
}