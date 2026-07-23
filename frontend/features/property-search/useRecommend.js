'use client';

import { useState, useEffect, useCallback } from 'react';
import { recommendProperties, getLocalities } from '@/shared/api/client';

const DEFAULT_FILTERS = {
  budget_min: 5000000,   // ₹50 L
  budget_max: 30000000,  // ₹3 Cr
  bhk: null,
  locality: null,
  furnish: null,
  gated_only: false,
};

export function useRecommend(city) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [localities, setLocalities] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!city) return;
    getLocalities(city)
      .then(setLocalities)
      .catch(() => setLocalities([])); // non-fatal -- the locality dropdown just stays empty
  }, [city]);

  const search = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      // Filters are kept as raw form values (strings/empty) in state and only
      // coerced into the API's expected types here, at the point of sending --
      // keeps <select>/<input> controlled-value types simple everywhere else.
      const payload = {
        budget_min: Number(filters.budget_min) || 0,
        budget_max: Number(filters.budget_max) || 0,
        bhk: filters.bhk ? Number(filters.bhk) : undefined,
        locality: filters.locality || undefined,
        furnish: filters.furnish || undefined,
        gated_only: !!filters.gated_only,
        top_n: 12,
      };
      const data = await recommendProperties(city, payload);
      setResults(data.results);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, [city, filters]);

  return { filters, setFilters, localities, results, loading, error, hasSearched, search };
}