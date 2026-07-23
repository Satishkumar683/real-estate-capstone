'use client';

import { useState, useEffect, useCallback } from 'react';
import { predictPrice, explainPrediction, getLocalities } from '@/shared/api/client';

const PROPERTY_TYPES = ['Residential Apartment', 'Independent/Builder Floor', 'Independent House/Villa'];
const FURNISH_OPTIONS = ['Unfurnished', 'Semifurnished', 'Furnished'];

const DEFAULT_FORM = {
  property_type: PROPERTY_TYPES[0],
  locality: null,
  bhk: 3,
  bathroom_num: 2,
  balcony_num: 1,
  area_sqft: 1500,
  floor_num: 3,
  total_floor: 10,
  furnish: 'Semifurnished',
  is_gated_community: false,
};

export function usePredict(city) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [localities, setLocalities] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!city) return;
    getLocalities(city)
      .then((locs) => {
        setLocalities(locs);
        setForm((f) => ({ ...f, locality: f.locality ?? locs[0] ?? null }));
      })
      .catch(() => setLocalities([]));
  }, [city]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = useCallback(async () => {
    if (!city || !form.locality) return;
    setLoading(true);
    setError(null);
    try {
      // Both calls use the same form fields -- predict is a live model call,
      // explain is served from a precomputed cache, so running them in
      // parallel doesn't create a slow-endpoint bottleneck.
      const [predictionResult, insightResult] = await Promise.all([
        predictPrice(city, form),
        explainPrediction(city, form),
      ]);
      setPrediction(predictionResult);
      setInsight(insightResult);
    } catch (err) {
      setError(err.message);
      setPrediction(null);
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, [city, form]);

  return {
    form, setField, localities, propertyTypes: PROPERTY_TYPES, furnishOptions: FURNISH_OPTIONS,
    prediction, insight, loading, error, submit,
  };
}