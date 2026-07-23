import Button from '@/shared/ui/Button';
import GoogleSignInButton from '@/features/auth/GoogleSignInButton';

// Google is real and functional (see auth.js + GoogleSignInButton). GitHub
// and email/password stay visible but disabled -- "keep every option
// visible, implement Google for now" per the brief. Wiring those up later
// just means adding a GitHub() provider to auth.js and a real Credentials
// provider; this page's layout doesn't need to change.
export default function LoginPage() {
  return (
    <main className="pt-24 max-w-sm mx-auto px-6 pb-20">
      <h1 className="font-display font-semibold text-navy text-2xl mb-6">Login</h1>

      <GoogleSignInButton />

      <button
        type="button"
        disabled
        className="w-full mt-3 flex items-center justify-center gap-2 border border-navy/15 rounded-md py-3 text-sm font-medium text-charcoal opacity-50 cursor-not-allowed"
      >
        Continue with GitHub (coming soon)
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-navy/10 flex-1" />
        <span className="text-xs text-charcoal">or</span>
        <div className="h-px bg-navy/10 flex-1" />
      </div>

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-charcoal">
          Email
          <input type="email" disabled placeholder="you@example.com"
            className="px-4 py-3 rounded-md border border-navy/15 bg-cream/50 text-navy" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-charcoal">
          Password
          <input type="password" disabled placeholder="••••••••"
            className="px-4 py-3 rounded-md border border-navy/15 bg-cream/50 text-navy" />
        </label>
        <Button type="button" disabled className="mt-2">Login with Email (coming soon)</Button>
      </form>

      <p className="text-sm text-charcoal mt-4">
        Don&apos;t have an account? <a href="/register" className="text-gold hover:underline">Register</a>
      </p>
    </main>
  );
}