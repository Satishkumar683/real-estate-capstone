import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from '@/features/auth/LoginForm';

export const metadata = {
  title: 'Register | RealEstateAI',
  description: 'Create an account on RealEstateAI via Google OAuth or email.',
};

export default function RegisterPage() {
  return (
    <main className="pt-28 max-w-sm mx-auto px-6 pb-20">
      <div className="text-center mb-6">
        <h1 className="font-display font-semibold text-navy text-3xl">Get Started</h1>
        <p className="text-xs text-charcoal mt-1.5">Create your account or use the demo login</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy/10">
        <Suspense fallback={<p className="text-sm text-charcoal text-center py-6">Loading registration...</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="text-xs text-center text-charcoal mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-gold font-medium hover:underline">
          Sign in here
        </Link>
      </p>
    </main>
  );
}