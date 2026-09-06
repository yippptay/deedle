'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function AuthBar() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          Playing as <span className="text-white font-medium">{session.user?.name}</span>
        </span>
        <button
          onClick={() => signOut()}
          className="text-xs text-gray-500 hover:text-white underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('discord')}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
    >
      Login with Discord
    </button>
  );
}