import Link from 'next/link';

export default function CityHubCard({ title, description, stat, href, comingSoon = false }) {
  const content = (
    <div
      className={`bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-6 h-full flex flex-col justify-between transition-all ${
        comingSoon ? 'opacity-65' : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-[#18181B] text-lg">{title}</h3>
          {comingSoon && (
            <span className="text-[10px] font-semibold text-[#52525B] bg-[#FAF8EE] border border-[#18181B]/15 rounded-full px-2.5 py-0.5 whitespace-nowrap">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-sm text-[#52525B] mt-2 leading-relaxed">{description}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-[#18181B]/10 flex items-center justify-between">
        {stat ? (
          <span className="text-xs font-medium text-[#18181B] bg-[#FAF8EE] border border-[#18181B]/15 rounded-lg px-2.5 py-1">
            {stat}
          </span>
        ) : <span />}

        {!comingSoon && (
          <span className="text-xs font-semibold text-[#18181B] bg-[#E8D5FF] border border-[#18181B] rounded-xl px-3 py-1.5 shadow-[0_1.5px_0_0_#18181B] inline-flex items-center gap-1.5 hover:bg-[#DFC2FF] transition-all">
            Explore &rarr;
          </span>
        )}
      </div>
    </div>
  );

  if (comingSoon) {
    return content;
  }

  return <Link href={href} className="block h-full">{content}</Link>;
}