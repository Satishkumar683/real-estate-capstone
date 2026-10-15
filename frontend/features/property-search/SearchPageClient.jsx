'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCities } from '@/shared/api/client';
import { useRecommend } from './useRecommend';
import SearchFilters from './SearchFilters';
import ResultsGrid from './ResultsGrid';

export default function SearchPageClient({ city }) {
  const { filters, setFilters, localities, results, loading, error, hasSearched, search } = useRecommend(city);
  const [cityLabel, setCityLabel] = useState(city);
  const [allCities, setAllCities] = useState([]);

  useEffect(() => {
    getCities()
      .then((cities) => {
        setAllCities(cities);
        const match = cities.find((c) => c.slug === city);
        if (match) setCityLabel(match.label);
      })
      .catch(() => {});
  }, [city]);

  return (
    <main className="min-h-screen bg-[#FAF8EE] pb-24">
      <section className="pt-28 pb-6 border-b border-[#18181B]/10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Flow badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <span>✓</span>
              <span>{cityLabel} Listings Verified</span>
            </span>
            <span className="bg-white border border-[#18181B]/15 text-[#18181B] rounded-full px-3 py-1 text-xs font-medium">
              ML Value Scoring Active
            </span>
          </div>

          <h1 className="font-display font-semibold text-[#18181B] text-3xl sm:text-4xl md:text-5xl tracking-tight">
            Find your next address in <span className="italic font-normal">{cityLabel}</span>.
          </h1>
          <p className="mt-3 text-base max-w-xl text-[#52525B] leading-relaxed">
            Every listing is checked against an XGBoost valuation model trained on authentic market transactions
            &mdash; so you always know if an asking price is fair.
          </p>

          {/* Quick city switch pills */}
          {allCities.length > 1 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#52525B]">Metro:</span>
              {allCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/search/${c.slug}`}
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

          <div className="mt-7">
            <SearchFilters
              filters={filters}
              setFilters={setFilters}
              localities={localities}
              onSearch={search}
              loading={loading}
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <ResultsGrid
          results={results}
          loading={loading}
          error={error}
          hasSearched={hasSearched}
          cityLabel={cityLabel}
        />
      </section>
    </main>
  );
}