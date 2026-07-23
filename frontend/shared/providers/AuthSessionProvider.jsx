'use client';

import { SessionProvider } from 'next-auth/react';

// Thin client wrapper -- SessionProvider itself needs 'use client', but
// layout.js stays a server component; this is the standard Auth.js pattern
// for making useSession() work in client components anywhere in the tree.
export default function AuthSessionProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}