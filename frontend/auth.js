import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Google-only for now. JWT sessions (no database/adapter needed) -- fine for
// "who is this person" without persisting user records yet. If GitHub or
// email/password get wired up later, they add as more entries in `providers`
// below; nothing else about this file needs to change structurally.
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // needed for local dev -- Auth.js otherwise rejects unrecognized hosts as a DNS-rebinding protection meant for hosted multi-tenant setups, which doesn't apply here
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
});