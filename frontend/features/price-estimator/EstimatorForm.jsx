'use client';

import Select from '@/shared/ui/Select';
import Button from '@/shared/ui/Button';

function NumberField({ label, value, onChange, min, step = 1 }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-charcoal">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-4 py-3 rounded-md border border-navy/15 text-navy focus:outline-none focus:border-gold"
      />
    </label>
  );
}

export default function EstimatorForm({ predict, loading }) {
  const { form, setField, localities, propertyTypes, furnishOptions, submit } = predict;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div className="flex flex-col gap-1 text-sm text-charcoal">
        Property type
        <Select
          label="Property type"
          value={form.property_type}
          onChange={(v) => setField('property_type', v)}
          options={propertyTypes}
        />
      </div>

      <div className="flex flex-col gap-1 text-sm text-charcoal">
        Locality
        <Select
          label="Locality"
          value={form.locality}
          onChange={(v) => setField('locality', v)}
          options={localities}
        />
      </div>

      <NumberField label="BHK" value={form.bhk} onChange={(v) => setField('bhk', v)} min={1} />
      <NumberField label="Bathrooms" value={form.bathroom_num} onChange={(v) => setField('bathroom_num', v)} min={0} />
      <NumberField label="Balconies" value={form.balcony_num} onChange={(v) => setField('balcony_num', v)} min={0} />
      <NumberField label="Area (sqft)" value={form.area_sqft} onChange={(v) => setField('area_sqft', v)} min={100} step={50} />
      <NumberField label="Floor number" value={form.floor_num} onChange={(v) => setField('floor_num', v)} min={0} />
      <NumberField label="Total floors in building" value={form.total_floor} onChange={(v) => setField('total_floor', v)} min={1} />

      <div className="flex flex-col gap-1 text-sm text-charcoal">
        Furnishing
        <Select
          label="Furnishing"
          value={form.furnish}
          onChange={(v) => setField('furnish', v)}
          options={furnishOptions}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-charcoal mt-6">
        <input
          type="checkbox"
          checked={form.is_gated_community}
          onChange={(e) => setField('is_gated_community', e.target.checked)}
          className="accent-gold"
        />
        Gated community
      </label>

      <div className="md:col-span-2">
        <Button type="submit" disabled={loading || !form.locality} className="w-full">
          {loading ? 'Estimating…' : 'Predict Price'}
        </Button>
      </div>
    </form>
  );
}