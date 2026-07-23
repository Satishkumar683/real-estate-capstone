'use client';

import { useEffect, useState } from 'react';
import { getCities } from '@/shared/api/client';
import { usePredict } from './usePredict';
import EstimatorForm from './EstimatorForm';
import InsightPanel from './InsightPanel';

export default function EstimatePageClient({ city }) {
  const predict = usePredict(city);
  const [cityLabel, setCityLabel] = useState(city);

  useEffect(() => {
    getCities()
      .then((cities) => {
        const match = cities.find((c) => c.slug === city);
        if (match) setCityLabel(match.label);
      })
      .catch(() => {});
  }, [city]);

  return (
    <main className="pt-24 max-w-5xl mx-auto px-6 pb-20">
      <p className="text-sm text-gold font-medium mb-2">{cityLabel}</p>
      <h1 className="font-display font-semibold text-navy text-3xl md:text-4xl">
        What's your property worth?
      </h1>
      <p className="mt-3 text-charcoal max-w-xl">
        Get a price estimate and see exactly which factors are pushing it up or down,
        based on comparable {cityLabel} listings.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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