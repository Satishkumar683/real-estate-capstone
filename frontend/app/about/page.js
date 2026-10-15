import Link from 'next/link';

const STATS = [
  { label: 'Listings analyzed', value: '25,650+' },
  { label: 'Active metros', value: '5 Metros' },
  { label: 'Top Model R²', value: '0.947' },
  { label: 'Features engineered', value: '56' },
];

const STEPS = [
  {
    title: 'Clean the market data',
    text: 'Raw listings scraped across 5 major metros go through our modular cleaning pipeline that parses nested fields, decodes missing values, and fixes unit bugs (such as sqmt-to-sqft discrepancies).',
  },
  {
    title: 'Train ensemble models',
    text: 'An XGBoost model is trained per city and evaluated with 5-fold cross validation. It explains up to 94.7% of price variance on held-out test listings.',
  },
  {
    title: 'Explain every factor (SHAP)',
    text: 'TreeSHAP breaks down every price prediction into individual contributing factors — locality, area, floor height, luxury amenities, and facing — so estimates come with clear attribution.',
  },
  {
    title: 'Serve in real time',
    text: 'A high-performance FastAPI service keeps model pipelines in memory, powering real-time search, valuation estimates, and market insights across all 5 metros.',
  },
];

const METRO_BREAKDOWN = [
  { city: 'Mumbai', listings: '5,907', r2: '0.947', baseline: 'XGBoost 56 features' },
  { city: 'Gurgaon', listings: '7,884', r2: '0.890', baseline: 'XGBoost 56 features' },
  { city: 'Hyderabad', listings: '5,939', r2: '0.841', baseline: 'XGBoost 56 features' },
  { city: 'Kolkata', listings: '6,009', r2: '0.892', baseline: 'XGBoost 56 features' },
  { city: 'Bangalore', listings: '812', r2: '0.533', baseline: 'XGBoost 56 features' },
];

export default function AboutPage() {
  return (
    <main className="pt-28 max-w-4xl mx-auto px-6 pb-20">
      {/* Flow badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
          <span>✓</span>
          <span>Verified Methodology</span>
        </span>
        <span className="bg-white border border-[#18181B]/15 text-[#18181B] rounded-full px-3 py-1 text-xs font-medium">
          Open Machine Learning
        </span>
      </div>

      <h1 className="font-display font-semibold text-[#18181B] text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.1]">
        A real estate platform built on an <span className="italic font-normal">actual model</span>, not a guess.
      </h1>
      <p className="mt-4 text-[#52525B] max-w-2xl leading-relaxed text-base sm:text-lg">
        RealEstateAI was built on one guiding principle: a property valuation is only trustworthy
        if you can see the underlying factors driving it. Every listing is evaluated against an
        XGBoost model trained on thousands of authentic market listings, backed by transparent
        SHAP factor attribution.
      </p>

      {/* Stats Cards */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-5 text-center">
            <p className="font-display font-bold text-[#18181B] text-2xl sm:text-3xl">{s.value}</p>
            <p className="text-xs text-[#52525B] mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Metro Status Table */}
      <div className="mt-12 bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-6">
        <h2 className="font-display font-semibold text-[#18181B] text-xl mb-4">Live Metro Coverage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {METRO_BREAKDOWN.map((m) => (
            <Link
              key={m.city}
              href={`/city/${m.city.toLowerCase()}`}
              className="bg-[#FAF8EE] border border-[#18181B]/10 rounded-xl p-3.5 hover:border-[#18181B]/30 hover:bg-[#E8D5FF]/30 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-sm text-[#18181B]">{m.city}</span>
                <span className="text-[10px] bg-[#E8D5FF] text-[#18181B] border border-[#18181B] font-mono px-2 py-0.5 rounded-full font-bold">
                  R² {m.r2}
                </span>
              </div>
              <p className="text-xs text-[#52525B] mt-1">{m.listings} processed listings</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Pipeline Steps */}
      <h2 className="font-display font-semibold text-[#18181B] text-2xl mt-14 mb-6">
        How a listing goes from a raw scrape to an estimate
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {STEPS.map((step, i) => (
          <div key={step.title} className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <span className="inline-block bg-[#E8D5FF] text-[#18181B] border border-[#18181B] text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg mb-2">
                Step 0{i + 1}
              </span>
              <h3 className="font-display font-semibold text-[#18181B] text-lg mt-1">{step.title}</h3>
              <p className="text-sm text-[#52525B] mt-2 leading-relaxed">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer attribution */}
      <div className="mt-12 pt-6 border-t border-[#18181B]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525B]">
        <span>Listing data sourced for educational and portfolio demonstration.</span>
        <Link href="/" className="text-[#18181B] font-semibold hover:underline">
          &larr; Return to Home
        </Link>
      </div>
    </main>
  );
}