'use client';

import { useEffect, useState } from 'react';
import { getCities } from '@/shared/api/client';
import { useRecommend } from './useRecommend';
import SearchFilters from './SearchFilters';
import ResultsGrid from './ResultsGrid';

export default function SearchPageClient({ city }) {
  const { filters, setFilters, localities, results, loading, error, hasSearched, search } = useRecommend(city);
  const [cityLabel, setCityLabel] = useState(city);

  useEffect(() => {
    getCities()
      .then((cities) => {
        const match = cities.find((c) => c.slug === city);
        if (match) setCityLabel(match.label);
      })
      .catch(() => {}); // non-fatal -- falls back to the raw slug
  }, [city]);

  return (
    <main>
      <section className="border-b border-navy/10">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
          <p className="text-sm text-gold font-medium mb-2">{cityLabel}</p>
          <h1 className="font-display font-semibold text-navy text-3xl md:text-4xl pt-10">
            Find your next address in {cityLabel}.
          </h1>
          <p className="mt-3 text-base max-w-xl text-charcoal">
            Every listing is checked against a price model trained on the whole market
            &mdash; so you always know if a number is fair before you call the broker.
          </p>

          <div className="mt-8">
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