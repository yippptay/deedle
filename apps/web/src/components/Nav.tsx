'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useCountdownToReset } from '@/hooks/useCountdown';

export function Nav() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const timeUntilReset = useCountdownToReset(() => window.location.reload());

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <Image
            src="/keksdeedle-logo.png"
            alt="KeksDeedle"
            width={120}
            height={28}
            className="h-9 w-auto object-contain"
            unoptimized
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono tabular-nums">
            Resets in {timeUntilReset}
          </span>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="text-white p-2 -mr-2 cursor-pointer"
          >
            <div className="relative w-5 h-4">
              <span
                className={`absolute inset-x-0 top-0 h-0.5 bg-current rounded-full transition-transform duration-300 ease-in-out ${
                  open ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-current rounded-full transition-opacity duration-200 ease-in-out ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 bg-current rounded-full transition-transform duration-300 ease-in-out ${
                  open ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* CSS-only accordion: animating grid-template-rows between 0fr and 1fr
          avoids having to measure content height in JS. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-zinc-800 bg-zinc-900 transition-opacity duration-200 ${
              open ? 'opacity-100 delay-100' : 'opacity-0'
            }`}
          >
            <div className="max-w-xl mx-auto flex flex-col px-4 py-3 gap-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Today's Quote
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Leaderboard
              </Link>

              <div className="border-t border-zinc-800 my-2" />

              {status !== 'loading' && (
                session ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      {session.user?.image && (
                        <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      Playing as <span className="text-white font-medium">{session.user?.name}</span>
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="text-sm text-gray-500 hover:text-white underline cursor-pointer"
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
        </div>
      </div>
    </nav>
  );
}