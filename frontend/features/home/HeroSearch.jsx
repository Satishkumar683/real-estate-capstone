'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const METROS = [
  { slug: 'mumbai', label: 'Mumbai', count: '5,907 listings', tag: '5.9k homes' },
  { slug: 'gurgaon', label: 'Gurgaon', count: '7,884 listings', tag: '7.8k homes' },
  { slug: 'hyderabad', label: 'Hyderabad', count: '5,939 listings', tag: '5.9k homes' },
  { slug: 'kolkata', label: 'Kolkata', count: '6,009 listings', tag: '6.0k homes' },
  { slug: 'bangalore', label: 'Bangalore', count: '812 listings', tag: '800+ homes' },
];

export default function HeroSearch({ cities }) {
  const router = useRouter();
  const activeCities = cities && cities.length > 0 ? cities : METROS;
  const [selectedCity, setSelectedCity] = useState(activeCities[0]?.slug || 'mumbai');

  const handleSearch = () => {
    if (!selectedCity) return;
    router.push(`/city/${selectedCity}`);
  };

  return (
    <section className="relative min-h-screen bg-[#FAF8EE] flex flex-col items-center justify-between pt-36 pb-12 px-4 overflow-hidden">
      {/* Decorative subtle ambient circular arcs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-[#18181B]/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[950px] rounded-full border border-[#18181B]/5 pointer-events-none" />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Verified Pine Badge & Transparent Valuation Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-7">
          <div className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-3.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
            </svg>
            <span>Verified Market Valuations</span>
          </div>

          <div className="bg-white border border-[#18181B]/15 text-[#18181B] rounded-full px-3.5 py-1.5 text-xs font-medium inline-flex items-center gap-2 shadow-xs">
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-2 bg-[#18181B] rounded-full" />
              <span className="w-0.5 h-3.5 bg-[#18181B] rounded-full" />
              <span className="w-0.5 h-2 bg-[#18181B] rounded-full" />
              <span className="w-0.5 h-1.5 bg-[#18181B] rounded-full" />
            </span>
            <span>Transparent Price Breakdown</span>
          </div>
        </div>

        {/* High-Contrast Editorial Serif Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] text-[#18181B] tracking-tight leading-[1.04] max-w-3xl">
          Don&apos;t guess, <span className="font-serif italic font-normal text-[#18181B]/90">know the price</span>
        </h1>

        {/* Clean geometric subtitle */}
        <p className="mt-6 text-[#52525B] text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
          The multi-city real estate platform that turns market data into crystal-clear price intelligence in every neighborhood.
        </p>

        {/* Signature Lilac Pill CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href={`/estimate/${selectedCity}`}
            className="bg-[#E8D5FF] text-[#18181B] border border-[#18181B] rounded-xl px-7 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_0_0_#18181B] hover:bg-[#DFC2FF] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#18181B] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
          >
            <span>⚡</span>
            <span>Check Property Valuation</span>
          </Link>
          <Link
            href="/search"
            className="bg-white text-[#18181B] border border-[#18181B]/20 rounded-xl px-5 py-3 text-sm font-medium hover:bg-black/5 hover:border-[#18181B]/40 transition-all"
          >
            Browse All Listings
          </Link>
        </div>

        {/* Microcopy */}
        <p className="mt-4 text-xs text-[#52525B]/80 font-medium">
          Available across Mumbai, Gurgaon, Hyderabad, Kolkata, and Bangalore
        </p>

        {/* Interactive Floating City Selector Pill */}
        <div className="mt-10 w-full max-w-xl bg-white border border-[#18181B]/15 rounded-2xl p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="flex-1 flex items-center px-3 bg-[#FAF8EE]/70 rounded-xl border border-[#18181B]/10">
            <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mr-2">Metro:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2.5 text-sm font-medium text-[#18181B] bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
            >
              {activeCities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label} {c.count ? `(${typeof c.count === 'number' ? c.count.toLocaleString('en-IN') : c.count} listings)` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="bg-[#18181B] text-white border border-[#18181B] rounded-xl px-6 py-2.5 text-sm font-medium shadow-[0_2px_0_0_#000000] hover:bg-[#27272A] hover:translate-y-[1px] active:translate-y-[2px] transition-all whitespace-nowrap"
          >
            Explore Market Hub &rarr;
          </button>
        </div>

        {/* Quick City Navigation Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {METROS.map((m) => (
            <button
              key={m.slug}
              onClick={() => {
                setSelectedCity(m.slug);
                router.push(`/city/${m.slug}`);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedCity === m.slug
                  ? 'bg-[#E8D5FF] text-[#18181B] border-[#18181B] shadow-xs'
                  : 'bg-white/80 text-[#52525B] border-[#18181B]/15 hover:border-[#18181B]/30 hover:text-[#18181B]'
              }`}
            >
              {m.label} <span className="text-[10px] opacity-75 font-medium">({m.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Signature Audio Waveform Capsule & Flowing Ribbon */}
      <div className="relative z-10 w-full mt-14 flex flex-col items-center">
        {/* Floating Audio Waveform Capsule */}
        <div className="mb-6 bg-white border-2 border-[#18181B] rounded-2xl px-5 py-2 inline-flex items-center gap-3 shadow-[0_3px_0_0_#18181B]">
          <div className="flex items-center gap-1 h-5">
            <span className="w-[3px] h-2 bg-[#18181B] rounded-full animate-pulse" />
            <span className="w-[3px] h-3.5 bg-[#18181B] rounded-full" />
            <span className="w-[3px] h-5 bg-[#18181B] rounded-full" />
            <span className="w-[3px] h-3 bg-[#18181B] rounded-full" />
            <span className="w-[3px] h-4.5 bg-[#18181B] rounded-full animate-pulse" />
            <span className="w-[3px] h-2 bg-[#18181B] rounded-full" />
            <span className="w-[3px] h-4 bg-[#18181B] rounded-full" />
            <span className="w-[3px] h-2.5 bg-[#18181B] rounded-full" />
            <span className="w-[3px] h-4 bg-[#18181B] rounded-full" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-[#18181B]">
            Real-time Price Driver Analysis Active
          </span>
        </div>

        {/* Dynamic Dark Ribbon */}
        <div className="w-full max-w-5xl bg-[#18181B] text-white py-3 px-6 rounded-2xl border border-[#18181B] shadow-sm overflow-hidden flex items-center justify-between text-xs sm:text-sm font-medium tracking-wide">
          <div className="flex items-center gap-3 truncate">
            <span className="text-[#E8D5FF] font-bold">25,651</span>
            <span>verified listings analyzed</span>
            <span className="text-white/30">•</span>
            <span className="text-[#E8D5FF] font-bold">95%+</span>
            <span>valuation precision</span>
            <span className="text-white/30">•</span>
            <span className="hidden sm:inline text-white/80">Zero guesswork real estate</span>
          </div>
          <Link
            href="/insights"
            className="text-[#E8D5FF] hover:underline font-semibold text-xs ml-4 whitespace-nowrap"
          >
            Explore Data &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}