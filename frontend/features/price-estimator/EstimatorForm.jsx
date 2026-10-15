'use client';

import Select from '@/shared/ui/Select';
import Button from '@/shared/ui/Button';

function NumberField({ label, value, onChange, min, step = 1 }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#52525B]">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3.5 py-2.5 rounded-xl border border-[#18181B]/15 bg-[#FAF8EE] text-[#18181B] text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#18181B]"
      />
    </label>
  );
}

export default function EstimatorForm({ predict, loading }) {
  const { form, setField, localities, propertyTypes, furnishOptions, submit } = predict;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div className="flex flex-col gap-1.5 text-xs font-semibold text-[#52525B]">
        Property Type
        <div className="bg-[#FAF8EE] rounded-xl border border-[#18181B]/15">
          <Select
            label="Property type"
            value={form.property_type}
            onChange={(v) => setField('property_type', v)}
            options={propertyTypes}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-xs font-semibold text-[#52525B]">
        Locality
        <div className="bg-[#FAF8EE] rounded-xl border border-[#18181B]/15">
          <Select
            label="Locality"
            value={form.locality}
            onChange={(v) => setField('locality', v)}
            options={localities}
          />
        </div>
      </div>

      <NumberField label="BHK Configuration" value={form.bhk} onChange={(v) => setField('bhk', v)} min={1} />
      <NumberField label="Bathrooms" value={form.bathroom_num} onChange={(v) => setField('bathroom_num', v)} min={0} />
      <NumberField label="Balconies" value={form.balcony_num} onChange={(v) => setField('balcony_num', v)} min={0} />
      <NumberField label="Built-up Area (sqft)" value={form.area_sqft} onChange={(v) => setField('area_sqft', v)} min={100} step={50} />
      <NumberField label="Floor Number" value={form.floor_num} onChange={(v) => setField('floor_num', v)} min={0} />
      <NumberField label="Total Floors in Building" value={form.total_floor} onChange={(v) => setField('total_floor', v)} min={1} />

      <div className="flex flex-col gap-1.5 text-xs font-semibold text-[#52525B]">
        Furnishing Status
        <div className="bg-[#FAF8EE] rounded-xl border border-[#18181B]/15">
          <Select
            label="Furnishing"
            value={form.furnish}
            onChange={(v) => setField('furnish', v)}
            options={furnishOptions}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-[#18181B] mt-6 select-none cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_gated_community}
          onChange={(e) => setField('is_gated_community', e.target.checked)}
          className="w-4 h-4 accent-[#18181B] rounded"
        />
        Gated Community / Security
      </label>

      <div className="md:col-span-2 mt-2">
        <Button type="submit" disabled={loading || !form.locality} className="w-full">
          {loading ? 'Calculating Fair Value…' : '⚡ Calculate Fair Value'}
        </Button>
      </div>
    </form>
  );
}