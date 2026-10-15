'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCities } from '@/shared/api/client';
import { usePredict } from './usePredict';
import EstimatorForm from './EstimatorForm';
import InsightPanel from './InsightPanel';

export default function EstimatePageClient({ city }) {
  const predict = usePredict(city);
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
    <main className="min-h-screen bg-[#FAF8EE] pt-28 max-w-5xl mx-auto px-6 pb-20">
      {/* Flow badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
          <span>✓</span>
          <span>{cityLabel} Market Intelligence</span>
        </span>
        <span className="bg-white border border-[#18181B]/15 text-[#18181B] rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5">
          <span>⚡</span>
          <span>Transparent Price Drivers</span>
        </span>
      </div>

      <h1 className="font-display font-semibold text-[#18181B] text-3xl sm:text-4xl md:text-5xl tracking-tight">
        What is your property <span className="italic font-normal">really worth?</span>
      </h1>
      <p className="mt-3 text-[#52525B] max-w-xl text-base sm:text-lg leading-relaxed">
        Get an instant property valuation with a clear breakdown of what&apos;s driving the price, based on thousands of verified {cityLabel} transactions.
      </p>

      {/* Metro switcher */}
      {allCities.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#52525B]">Metro:</span>
          {allCities.map((c) => (
            <Link
              key={c.slug}
              href={`/estimate/${c.slug}`}
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <EstimatorForm predict={predict} loading={predict.loading} />
        <InsightPanel
          prediction={predict.prediction}
          insight={predict.insight}
          loading={predict.loading}
          error={predict.error}
        />
      </div>
    </main>
  );
}