import SearchPageClient from '@/features/property-search/SearchPageClient';

// Server component wrapper: Next.js passes dynamic route params as a Promise
// even into pages that render client components, so we await it here and pass
// the resolved city down as a plain prop -- keeps the actual interactive page
// a normal client component instead of an async one (which isn't allowed).
export default async function SearchPage({ params }) {
  const { city } = await params;
  return <SearchPageClient city={city} />;
}