import PropertyCard from './PropertyCard';

export default function ResultsGrid({ results, loading, error, hasSearched, cityLabel }) {
  if (loading) {
    return <p className="text-sm text-charcoal py-16 text-center">Searching listings...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700 py-16 text-center">{error}</p>;
  }

  if (!hasSearched) {
    return (
      <p className="text-sm text-charcoal py-16 text-center">
        Set your filters above and search to see matching listings.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-charcoal py-16 text-center">
        No listings match those filters. Try widening the budget.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((listing) => (
        <PropertyCard key={listing.prop_id} listing={listing} cityLabel={cityLabel} />
      ))}
    </div>
  );
}