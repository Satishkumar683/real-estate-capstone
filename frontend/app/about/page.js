const STATS = [
  { label: 'Listings analyzed', value: '7,880' },
  { label: 'Model R\u00b2 (test set)', value: '0.90' },
  { label: 'Median price error', value: '\u00b111%' },
  { label: 'Cities live', value: '1' },
];

const STEPS = [
  {
    title: 'Clean the market',
    text: 'Raw listings scraped from 99acres go through a cleaning pipeline that parses nested fields, decodes what can be honestly decoded, and fixes real data issues \u2014 including a unit bug where area was mislabeled as square feet when it was actually square meters.',
  },
  {
    title: 'Learn the pattern',
    text: 'An XGBoost model is trained on the cleaned data and compared against three other approaches. It wins by a wide margin, explaining about 90% of price variation on listings it has never seen.',
  },
  {
    title: 'Explain the number',
    text: "SHAP values break down every prediction into the individual factors pushing it up or down \u2014 locality, area, floor, amenities \u2014 so a price estimate comes with a reason, not just a figure.",
  },
  {
    title: 'Serve it live',
    text: 'A FastAPI service keeps the model and data in memory and answers search, estimation, and insight requests in real time, one city at a time.',
  },
];

export default function AboutPage() {
  return (
    <main className="pt-24 max-w-4xl mx-auto px-6 pb-20">
      <p className="text-sm text-gold font-medium mb-2">About</p>
      <h1 className="font-display font-semibold text-navy text-3xl md:text-4xl">
        A real estate platform built on an actual model, not a guess.
      </h1>
      <p className="mt-4 text-charcoal max-w-2xl leading-relaxed">
        RealEstateAI is a capstone project built around one idea: a price estimate is only
        useful if you can see why it's the number it is. Every listing here is checked
        against a model trained on thousands of real transactions, and every estimate comes
        with a plain-language explanation of what's driving it.
      </p>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 text-center">
            <p className="font-display font-semibold text-navy text-2xl">{s.value}</p>
            <p className="text-xs text-charcoal mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display font-semibold text-navy text-2xl mt-14 mb-6">
        How a listing goes from a scrape to an estimate
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STEPS.map((step, i) => (
          <div key={step.title} className="bg-white rounded-xl shadow-sm p-6">
            <span className="text-xs font-mono text-gold">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="font-display font-semibold text-navy text-lg mt-1">{step.title}</h3>
            <p className="text-sm text-charcoal mt-2 leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 bg-beige rounded-xl p-6">
        <h2 className="font-display font-semibold text-navy text-xl mb-3">Where things stand today</h2>
        <p className="text-sm text-charcoal leading-relaxed">
          Gurgaon is the only city fully live right now &mdash; cleaned, modeled, and served.
          Five more cities (Bangalore, Chandigarh, Hyderabad, Kolkata, Mumbai) have been
          scraped and are waiting on the same pipeline. Two features on the city dashboard
          &mdash; Luxury Score and Price Trends &mdash; are still marked "Coming soon"
          rather than shipped half-finished; a genuine price-trend chart in particular needs
          data collected over time, which a single scrape snapshot doesn't provide yet.
        </p>
      </div>

      <p className="text-xs text-charcoal/60 mt-10">
        Listing data sourced from 99acres.com for educational and portfolio purposes.
      </p>
    </main>
  );
}