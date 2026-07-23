import Link from 'next/link';

export default function CityHubCard({ title, description, stat, href, comingSoon = false }) {
  const content = (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 h-full flex flex-col ${
        comingSoon ? 'opacity-60' : 'hover:shadow-md transition-shadow cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-display font-semibold text-navy text-lg">{title}</h3>
        {comingSoon && (
          <span className="text-[11px] text-charcoal border border-charcoal/30 rounded-full px-2 py-0.5 whitespace-nowrap">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-sm text-charcoal mt-2 flex-1">{description}</p>
      {stat && <p className="text-sm text-gold font-medium mt-4">{stat}</p>}
      {!comingSoon && (
        <span className="text-sm font-medium text-gold mt-4 inline-flex items-center gap-1">
          Explore &rarr;
        </span>
      )}
    </div>
  );

  if (comingSoon) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}