export default function Select({ label, placeholder, value, onChange, options }) {
  return (
    <label className="flex-1 flex flex-col gap-1">
      {label && <span className="sr-only">{label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-4 py-3 text-sm text-navy bg-transparent border-0 focus:ring-0 focus:outline-none"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}