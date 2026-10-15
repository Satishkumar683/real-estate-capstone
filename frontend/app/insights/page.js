import { redirect } from 'next/navigation';
import { fetchFromMlService } from '@/shared/api/serverClient';

export default async function InsightsIndexPage() {
  const cities = await fetchFromMlService('/cities').catch(() => []);
  const target = cities.length > 0 ? cities[0].slug : 'gurgaon';
  redirect(`/insights/${target}`);
}