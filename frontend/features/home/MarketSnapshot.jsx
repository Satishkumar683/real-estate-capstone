export default function MarketSnapshot({ totalListings, citiesCount }) {
  const stats = [
    { label: 'Listings indexed', value: totalListings.toLocaleString('en-IN') },
    { label: 'Cities live', value: citiesCount },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-2xl font-semibold text-navy">{s.value}</p>
            <p className="text-sm text-charcoal mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}