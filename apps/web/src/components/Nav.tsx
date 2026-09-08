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
                Today&apos;s Quote
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
                    className="flex mx-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors text-left cursor-pointer"
                  >
                    Login with Discord
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="ml-auto mt-1 items-center" viewBox="0 0 16 16">
                      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                    </svg>
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