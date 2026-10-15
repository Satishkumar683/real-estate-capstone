'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

const CITIES = [
  { slug: 'mumbai', label: 'Mumbai', count: '5,907' },
  { slug: 'gurgaon', label: 'Gurgaon', count: '7,884' },
  { slug: 'hyderabad', label: 'Hyderabad', count: '5,939' },
  { slug: 'kolkata', label: 'Kolkata', count: '6,009' },
  { slug: 'bangalore', label: 'Bangalore', count: '812' },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cityDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setCityMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCityMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-4xl bg-white/90 backdrop-blur-md border border-[#18181B]/15 rounded-2xl shadow-sm px-5 py-2.5 flex items-center justify-between transition-all">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Waveform Equalizer Icon (Flow signature) */}
          <div className="flex items-end gap-[2.5px] h-4.5 px-0.5">
            <span className="w-[3px] h-2.5 bg-[#18181B] rounded-full transition-all group-hover:h-3.5" />
            <span className="w-[3px] h-4.5 bg-[#18181B] rounded-full transition-all group-hover:h-2.5" />
            <span className="w-[3px] h-3 bg-[#18181B] rounded-full transition-all group-hover:h-4.5" />
            <span className="w-[3px] h-2 bg-[#18181B] rounded-full transition-all group-hover:h-3" />
          </div>
          <span className="font-display font-semibold text-base sm:text-lg text-[#18181B] tracking-tight">
            RealEstate<span className="font-sans font-bold">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#18181B]/80">
          <Link
            href="/search"
            className={`hover:text-[#18181B] transition-colors ${
              pathname.startsWith('/search') ? 'text-[#18181B] font-semibold' : ''
            }`}
          >
            Buy
          </Link>

          <Link
            href="/estimate"
            className={`hover:text-[#18181B] transition-colors ${
              pathname.startsWith('/estimate') ? 'text-[#18181B] font-semibold' : ''
            }`}
          >
            Estimate
          </Link>

          {/* Cities Dropdown */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              onClick={() => setCityMenuOpen(!cityMenuOpen)}
              className="flex items-center gap-1 hover:text-[#18181B] transition-colors focus:outline-none"
              aria-expanded={cityMenuOpen}
            >
              <span>Cities</span>
              <svg
                className={`w-3 h-3 text-[#18181B]/70 transition-transform duration-200 ${
                  cityMenuOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {cityMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white border border-[#18181B]/15 rounded-2xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">
                  Select Metros (5)
                </div>
                {CITIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    onClick={() => setCityMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#18181B] hover:bg-[#FAF8EE] transition-colors"
                  >
                    <span>{c.label}</span>
                    <span className="text-[10px] text-[#52525B] bg-[#18181B]/5 px-2 py-0.5 rounded-full">
                      {c.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/insights"
            className={`hover:text-[#18181B] transition-colors ${
              pathname.startsWith('/insights') ? 'text-[#18181B] font-semibold' : ''
            }`}
          >
            Insights
          </Link>

          <Link
            href="/about"
            className={`hover:text-[#18181B] transition-colors ${
              pathname === '/about' ? 'text-[#18181B] font-semibold' : ''
            }`}
          >
            About
          </Link>
        </nav>

        {/* Right CTA / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block h-4 w-px bg-[#18181B]/15 mx-1" />

          {status === 'authenticated' ? (
            <div className="flex items-center gap-2.5">
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-7 h-7 rounded-full border border-[#18181B]/20"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#E8D5FF] border border-[#18181B] text-[11px] font-bold flex items-center justify-center text-[#18181B]">
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-[#18181B] hidden lg:inline max-w-[100px] truncate">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-xs font-medium text-[#52525B] hover:text-[#18181B] transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-[#18181B]/80 hover:text-[#18181B] px-1.5 sm:px-2 py-1 transition-colors"
              >
                Login
              </Link>
              {/* Flow Signature Lilac Pill Button */}
              <Link
                href="/estimate"
                className="bg-[#E8D5FF] text-[#18181B] border border-[#18181B] rounded-xl px-3 sm:px-4 py-1.5 text-xs sm:text-xs font-semibold shadow-[0_2px_0_0_#18181B] hover:bg-[#DFC2FF] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#18181B] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5"
              >
                <span className="text-[11px]">⚡</span>
                <span>Estimate</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#18181B] hover:bg-black/5 rounded-lg focus:outline-none ml-1"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden absolute top-20 inset-x-4 bg-white/95 backdrop-blur-md border border-[#18181B]/15 rounded-2xl shadow-xl p-5 flex flex-col gap-4 animate-in fade-in duration-200">
          <Link
            href="/search"
            className="text-sm font-medium text-[#18181B] py-1 border-b border-[#18181B]/10"
          >
            Buy Listings
          </Link>
          <Link
            href="/estimate"
            className="text-sm font-medium text-[#18181B] py-1 border-b border-[#18181B]/10"
          >
            Valuation Estimator
          </Link>
          <Link
            href="/insights"
            className="text-sm font-medium text-[#18181B] py-1 border-b border-[#18181B]/10"
          >
            Market Insights
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-[#18181B] py-1 border-b border-[#18181B]/10"
          >
            About Model
          </Link>
          <div className="pt-2">
            <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-2">Explore Metros</p>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/city/${c.slug}`}
                  className="px-3 py-2 text-xs bg-[#FAF8EE] rounded-xl font-medium text-[#18181B] flex items-center justify-between"
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] text-[#52525B]">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}