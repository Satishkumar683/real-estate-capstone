'use client';

import Select from '@/shared/ui/Select';
import Button from '@/shared/ui/Button';

const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
];

const FURNISH_OPTIONS = [
  { value: 'Furnished', label: 'Furnished' },
  { value: 'Semifurnished', label: 'Semifurnished' },
  { value: 'Unfurnished', label: 'Unfurnished' },
];

export default function SearchFilters({ filters, setFilters, localities, onSearch, loading }) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-2 flex flex-col md:flex-row gap-2">
      <Select
        label="Locality"
        placeholder="Any locality"
        value={filters.locality}
        onChange={(v) => set('locality', v)}
        options={localities}
      />
      <div className="w-px bg-navy/10 hidden md:block" />

      <input
        type="number"
        placeholder="Min budget (₹)"
        value={filters.budget_min}
        onChange={(e) => set('budget_min', e.target.value)}
        className="flex-1 px-4 py-3 text-sm text-navy bg-transparent border-0 focus:ring-0 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Max budget (₹)"
        value={filters.budget_max}
        onChange={(e) => set('budget_max', e.target.value)}
        className="flex-1 px-4 py-3 text-sm text-navy bg-transparent border-0 focus:ring-0 focus:outline-none"
      />
      <div className="w-px bg-navy/10 hidden md:block" />

      <Select
        label="BHK"
        placeholder="Any BHK"
        value={filters.bhk}
        onChange={(v) => set('bhk', v)}
        options={BHK_OPTIONS}
      />
      <Select
        label="Furnishing"
        placeholder="Any furnishing"
        value={filters.furnish}
        onChange={(v) => set('furnish', v)}
        options={FURNISH_OPTIONS}
      />

      <Button onClick={onSearch} disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </Button>
    </div>
  );
}