import EstimatePageClient from '@/features/price-estimator/EstimatePageClient';

export default async function EstimatePage({ params }) {
  const { city } = await params;
  return <EstimatePageClient city={city} />;
}