'use client';

import { useState, useEffect } from 'react';
import { getListing } from '@/shared/api/client';

export function useListing(propId, city) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!propId) return;
    setLoading(true);
    setError(null);

    getListing(city, propId)
      .then((data) => {
        setListing(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load property details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [propId, city]);

  return { listing, loading, error };
}
