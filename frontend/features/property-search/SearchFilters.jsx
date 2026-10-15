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
    <div className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-2.5 flex flex-col md:flex-row items-center gap-2">
      <div className="flex-1 w-full bg-[#FAF8EE] rounded-xl border border-[#18181B]/10">
        <Select
          label="Locality"
          placeholder="Any locality"
          value={filters.locality}
          onChange={(v) => set('locality', v)}
          options={localities}
        />
      </div>

      <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          placeholder="Min budget (₹)"
          value={filters.budget_min}
          onChange={(e) => set('budget_min', e.target.value)}
          className="w-full sm:w-36 px-3.5 py-2.5 text-xs font-medium text-[#18181B] bg-[#FAF8EE] rounded-xl border border-[#18181B]/10 focus:ring-1 focus:ring-[#18181B] focus:outline-none"
        />
        <input
          type="number"
          placeholder="Max budget (₹)"
          value={filters.budget_max}
          onChange={(e) => set('budget_max', e.target.value)}
          className="w-full sm:w-36 px-3.5 py-2.5 text-xs font-medium text-[#18181B] bg-[#FAF8EE] rounded-xl border border-[#18181B]/10 focus:ring-1 focus:ring-[#18181B] focus:outline-none"
        />
      </div>

      <div className="w-full md:w-auto flex gap-2">
        <div className="flex-1 sm:w-28 bg-[#FAF8EE] rounded-xl border border-[#18181B]/10">
          <Select
            label="BHK"
            placeholder="Any BHK"
            value={filters.bhk}
            onChange={(v) => set('bhk', v)}
            options={BHK_OPTIONS}
          />
        </div>
        <div className="flex-1 sm:w-32 bg-[#FAF8EE] rounded-xl border border-[#18181B]/10">
          <Select
            label="Furnishing"
            placeholder="Furnishing"
            value={filters.furnish}
            onChange={(v) => set('furnish', v)}
            options={FURNISH_OPTIONS}
          />
        </div>
      </div>

      <Button onClick={onSearch} disabled={loading} className="w-full md:w-auto whitespace-nowrap">
        {loading ? 'Searching…' : 'Search Listings'}
      </Button>
    </div>
  );
}