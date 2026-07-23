'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Buy' },
  { href: '/estimate', label: 'Prediction' },
  { href: '/insights', label: 'Insights' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll(); // in case the page loads already scrolled (e.g. back-navigation)
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Text is ALWAYS white -- simpler and more robust than switching between
  // light/dark text depending on state (which is what caused an earlier bug:
  // dynamically-interpolated Tailwind classes silently produced no CSS).
  // Background goes from fully transparent (over the home hero image) to a
  // dimmed, blurred dark panel everywhere else, including on scroll.
  const showTransparent = isHome && !scrolled;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        showTransparent ? 'bg-transparent' : 'bg-navy/75 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-xl text-white">
          RealEstate<span className="text-gold">AI</span>
        </Link>

        {!isHome && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/80">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {status === 'authenticated' ? (
            <>
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element -- external Google avatar URL, next/image domain config not worth it for a small avatar
                <img src={session.user.image} alt={session.user.name || 'Profile'} className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm text-white/90 hidden sm:inline">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-white/80 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white">
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-gold text-white px-4 py-2 rounded-md hover:brightness-95"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}