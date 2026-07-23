'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLocalities, predictPrice, explainPrice } from '@/shared/api/client';

// Only Gurgaon has been through the pipeline so far -- every other city 404s
// on ml-service right now, so there's nothing to let the user pick between yet.
const CITY = 'gurgaon';

const INITIAL_FIELDS = {
  property_type: '',
  locality: '',
  bhk: '',
  bathroom_num: '',
  balcony_num: 0,
  area_sqft: '',
  floor_num: '',
  total_floor: '',
  furnish: 'Semifurnished',
  is_gated_community: false,
};

export default function useEstimate() {
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [localities, setLocalities] = useState([]);
  const [localitiesLoading, setLocalitiesLoading] = useState(true);
  const [result, setResult] = useState(null); // { predict, explain }
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getLocalities(CITY)
      .then((data) => {
        if (!cancelled) setLocalities(data);
      })
      .catch(() => {
        if (!cancelled) setLocalities([]);
      })
      .finally(() => {
        if (!cancelled) setLocalitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback((name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  const isValid = Boolean(
    fields.property_type &&
      fields.locality &&
      fields.bhk &&
      fields.bathroom_num !== '' &&
      fields.area_sqft &&
      fields.floor_num !== '' &&
      fields.total_floor
  );

  const submit = useCallback(async () => {
    if (!isValid) return;
    setStatus('loading');
    setError(null);

    const payload = {
      ...fields,
      bhk: Number(fields.bhk),
      bathroom_num: Number(fields.bathroom_num),
      balcony_num: Number(fields.balcony_num) || 0,
      area_sqft: Number(fields.area_sqft),
      floor_num: Number(fields.floor_num),
      total_floor: Number(fields.total_floor),
    };

    try {
      // Two distinct ml-service endpoints, fired together so the results
      // panel can render the headline number and the SHAP breakdown at once.
      const [predict, explain] = await Promise.all([
        predictPrice(CITY, payload),
        explainPrice(CITY, payload),
      ]);
      setResult({ predict, explain });
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Something went wrong while estimating the price.');
      setStatus('error');
    }
  }, [fields, isValid]);

  const reset = useCallback(() => {
    setFields(INITIAL_FIELDS);
    setResult(null);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    city: CITY,
    fields,
    updateField,
    localities,
    localitiesLoading,
    isValid,
    status,
    error,
    result,
    submit,
    reset,
  };
}