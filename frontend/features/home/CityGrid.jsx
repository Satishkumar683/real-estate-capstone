import Link from 'next/link';

export default function CityGrid({ cities }) {
  if (!cities || cities.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-sm text-charcoal">
          No cities are live yet &mdash; run the pipeline + model notebooks for at least one city
          and restart ml-service.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="font-display font-semibold text-navy text-2xl mb-6">Available Cities</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cities.map((c) => (
          <Link
            key={c.slug}
            href={`/city/${c.slug}`}
            className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow"
          >
            <p className="font-medium text-navy">{c.label}</p>
            <p className="text-xs text-charcoal mt-1">{c.count.toLocaleString('en-IN')} listings</p>
          </Link>
        ))}
      </div>
    </section>
  );
}