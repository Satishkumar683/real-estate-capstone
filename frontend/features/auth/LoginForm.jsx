'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/shared/ui/Button';
import GoogleSignInButton from './GoogleSignInButton';

const ERROR_MESSAGES = {
  OAuthSignin: 'Error starting Google Sign-in. Check authorized redirect URIs in Google Cloud Console.',
  OAuthCallback: 'Error during Google authentication callback.',
  OAuthCreateAccount: 'Could not create account via Google.',
  EmailCreateAccount: 'Could not create account via email.',
  Callback: 'Authentication callback failed.',
  OAuthAccountNotLinked: 'This email is already associated with another login provider.',
  EmailSignin: 'Failed to send login email.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'Please log in to view this page.',
  MissingCSRF: 'CSRF token missing or mismatch. Ensure your site URL matches the configured AUTH_URL.',
  Default: 'Unable to sign in. Please try again or use the demo login.',
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawError = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const displayError = formError || (rawError ? (ERROR_MESSAGES[rawError] || ERROR_MESSAGES.Default) : null);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setFormError('Please enter an email address.');
      return;
    }
    setLoading(true);
    setFormError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password: password || 'demo123',
        redirect: false,
        callbackUrl,
        redirectTo: callbackUrl,
      });

      if (res?.error) {
        setFormError(ERROR_MESSAGES[res.error] || 'Invalid login details.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setFormError(null);
    try {
      const res = await signIn('credentials', {
        email: 'student.nit@realestate.ai',
        password: 'password123',
        redirect: false,
        callbackUrl,
        redirectTo: callbackUrl,
      });

      if (res?.error) {
        setFormError(ERROR_MESSAGES[res.error] || 'Demo sign in failed.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setFormError(err.message || 'Could not complete demo sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3.5 text-xs leading-relaxed">
          <p className="font-semibold mb-0.5">Authentication Notice</p>
          <p>{displayError}</p>
        </div>
      )}

      {/* Google OAuth Login */}
      <GoogleSignInButton callbackUrl={callbackUrl} />

      {/* Quick 1-Click Demo Login */}
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-gold/40 bg-gold/10 hover:bg-gold/20 text-navy rounded-md py-3 text-sm font-medium transition-colors cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-gold" />
        One-Click Demo Login (student.nit@realestate.ai)
      </button>

      <div className="flex items-center gap-3 my-1">
        <div className="h-px bg-navy/10 flex-1" />
        <span className="text-xs text-charcoal/70">or continue with email</span>
        <div className="h-px bg-navy/10 flex-1" />
      </div>

      {/* Working Email / Password Credentials Form */}
      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1 text-sm text-charcoal">
          Email address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@nit.ac.in"
            className="px-4 py-2.5 rounded-md border border-navy/15 bg-white text-navy focus:outline-none focus:border-gold text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-charcoal">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="px-4 py-2.5 rounded-md border border-navy/15 bg-white text-navy focus:outline-none focus:border-gold text-sm"
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !email}
          className="mt-2 w-full py-3"
        >
          {loading ? 'Signing in…' : 'Sign in with Email'}
        </Button>
      </form>
    </div>
  );
}
