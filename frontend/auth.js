import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'e6caa979fb6369dacfdc358d0be6352b6672f2610dee9a8e93442831d3ec1446',
  trustHost: true, // trust localhost and dynamic incoming headers
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = String(credentials.email).trim().toLowerCase();
        // Form a readable name from email prefix (e.g., student.nit@gmail.com -> Student Nit)
        const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
        const name = namePart.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Demo User';

        return {
          id: `user-${email}`,
          name,
          email,
          image: null,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || token.sub;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }
      return session;
    },
  },
});