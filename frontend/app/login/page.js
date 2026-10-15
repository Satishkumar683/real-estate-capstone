import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from '@/features/auth/LoginForm';

export const metadata = {
  title: 'Sign In | RealEstateAI',
  description: 'Sign in to RealEstateAI via Google OAuth or demo account.',
};

export default function LoginPage() {
  return (
    <main className="pt-28 max-w-sm mx-auto px-6 pb-20">
      <div className="text-center mb-6">
        <h1 className="font-display font-semibold text-navy text-3xl">Welcome Back</h1>
        <p className="text-xs text-charcoal mt-1.5">Sign in to explore verified AI valuations and listings</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy/10">
        <Suspense fallback={<p className="text-sm text-charcoal text-center py-6">Loading login...</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="text-xs text-center text-charcoal mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-gold font-medium hover:underline">
          Register here
        </Link>
      </p>
    </main>
  );
}