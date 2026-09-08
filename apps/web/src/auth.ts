import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // `account` is only present on the initial sign-in — capture Discord's
    // own account id into the token here so it's available on every later
    // request. We use `account.providerAccountId` rather than `user.id`:
    // without a database adapter, Auth.js doesn't guarantee `user.id` stays
    // the same across sign-ins (it can mint a fresh one each time), which
    // was letting people replay the daily game just by logging out and back
    // in. `providerAccountId` is Discord's actual user ID and never changes.
    async jwt({ token, account }) {
      if (account) {
        token.id = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
});