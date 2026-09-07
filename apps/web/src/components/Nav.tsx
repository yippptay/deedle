'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export function Nav() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Who Said It?
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="text-white p-2 -mr-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-800 bg-gray-900">
          <div className="max-w-xl mx-auto flex flex-col px-4 py-3 gap-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800 text-sm font-medium"
            >
              Today's Quote
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800 text-sm font-medium"
            >
              Leaderboard
            </Link>

            <div className="border-t border-gray-800 my-2" />

            {status !== 'loading' && (
              session ? (
                <div className="flex items-center justify-between px-3 py-2">
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
              ) : (
                <button
                  onClick={() => { setOpen(false); signIn('discord'); }}
                  className="mx-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors text-left"
                >
                  Login with Discord
                </button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}