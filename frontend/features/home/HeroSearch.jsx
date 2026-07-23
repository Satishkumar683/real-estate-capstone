'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Select from '@/shared/ui/Select';
import Button from '@/shared/ui/Button';

export default function HeroSearch({ cities }) {
  const router = useRouter();
  const [city, setCity] = useState(cities[0]?.slug ?? null);

  const cityOptions = cities.map((c) => ({ value: c.slug, label: c.label }));

  const handleSearch = () => {
    if (!city) return;
    router.push(`/city/${city}`);
  };

  return (
    <section className="relative min-h-screen flex items-end">
      {/* Background: a rich diagonal gradient as the base (shows through if the
          image below is missing/404s -- CSS falls back to whatever's declared
          after a failed background-image), with a real photo layered on top
          if present. Drop your own licensed photo at public/images/hero-bg.jpg
          (no watermark) and it takes over automatically, no code change needed. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/hero-bg.jpg'), linear-gradient(135deg, #4A3B2C 0%, #2E2418 55%, #1C1611 100%)",
        }}
      />
      {/* Subtle champagne glow for warmth/premium feel -- visible whether or
          not a photo is present. */}
      <div className="absolute inset-0 warm-texture" />
      {/* Contrast scrim for text legibility -- deliberately neutral black,
          NOT the same brown as the base above. Same-color-on-same-color is
          what produced the flat "muddy vapour" look; a neutral dark scrim
          creates actual depth instead of a monochrome wash. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

      <div className="relative z-[1] max-w-6xl mx-auto px-6 pb-16 pt-32 w-full">
        <h1 className="font-display font-semibold text-4xl md:text-5xl text-white leading-tight max-w-xl">
          Find your <span className="text-gold">dream home</span> with data on your side.
        </h1>
        <p className="mt-4 text-white/80 text-lg max-w-lg">
          Every listing checked against a price model trained on the whole market.
        </p>

        <div className="mt-8 bg-white rounded-lg p-2 flex flex-col md:flex-row gap-2 max-w-md">
          <Select
            label="City"
            placeholder="Select a city"
            value={city}
            onChange={setCity}
            options={cityOptions}
          />
          <Button onClick={handleSearch} disabled={!city}>
            Search
          </Button>
        </div>
      </div>
    </section>
  );
}