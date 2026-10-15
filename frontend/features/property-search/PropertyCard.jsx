'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <article className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col justify-between group">
      <div>
        <div className="relative overflow-hidden aspect-[4/3] bg-[#FAF8EE] border-b border-[#18181B]/10">
          {showImage ? (
            <Image
              src={listing.thumbnail_url}
              alt={`${listing.property_type} in ${listing.locality}, ${cityLabel || ''}`}
              fill
              unoptimized
              onError={() => setImgFailed(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <ImagePlaceholder label={`${listing.bhk} BHK ${listing.property_type}`} />
          )}
          <div className="absolute top-3 left-3">
            <Badge tone={badge.tone} className="shadow-xs font-semibold">
              {badge.label}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-[#18181B] text-base leading-snug line-clamp-1">
              {title}
            </h3>
            {listing.furnish && (
              <span className="text-[10px] text-[#52525B] bg-[#FAF8EE] border border-[#18181B]/15 rounded-full px-2 py-0.5 whitespace-nowrap font-medium">
                {listing.furnish}
              </span>
            )}
          </div>
          <p className="text-xs text-[#52525B] mt-1 line-clamp-1">
            {listing.locality}{cityLabel ? `, ${cityLabel}` : ''}
          </p>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-display font-bold text-[#18181B]">
              {formatINR(listing.price)}
            </span>
            <span className="text-[11px] text-[#71717A] font-mono">
              {formatPricePerSqft(pricePerSqft)}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-[#18181B]/10 flex items-center justify-between text-xs text-[#52525B]">
            <span className="font-medium">{listing.bhk} BHK</span>
            <span>•</span>
            <span>{formatArea(listing.area_sqft)}</span>
            <span>•</span>
            <span className="capitalize">{listing.property_type}</span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Link
          href={`/listing/${listing.prop_id}${listing.city ? `?city=${listing.city}` : ''}`}
          className="w-full text-center bg-[#FAF8EE] hover:bg-[#E8D5FF] text-[#18181B] border border-[#18181B]/20 hover:border-[#18181B] rounded-xl py-2 px-3 text-xs font-semibold shadow-xs hover:shadow-[0_2px_0_0_#18181B] transition-all flex items-center justify-center gap-1.5"
        >
          <span>View Valuation Details</span>
          <span className="text-xs">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}