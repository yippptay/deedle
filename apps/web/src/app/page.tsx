'use client';

import { useSession, signIn } from 'next-auth/react';
import { useGame } from '@/hooks/useGame';
import { useCountdownToReset } from '@/hooks/useCountdown';
import { MAX_GUESSES } from '@/lib/constants';

export default function HomePage() {
  const { data: session, status } = useSession();
  const game = useGame();
  const timeUntilReset = useCountdownToReset(() => window.location.reload());

  if (status === 'loading' || game.loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-800 text-white">
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </main>
    );
  }

  const remainingGuesses = MAX_GUESSES - game.guesses.length;
  const availableOptions = game.options.filter(o => !game.guesses.includes(o.username));
  const hasAka = game.revealedNickname && game.revealedNickname !== game.revealedAuthor;

  return (
    <main className="flex-1 bg-zinc-800 text-white flex flex-col items-center py-10 px-4">
      <h2 className="text-xl font-semibold text-gray-300 mb-6">Today's Quote</h2>

      {!session && (
        <div className="w-full max-w-xl bg-indigo-900/40 border border-indigo-700 rounded-xl p-4 mb-6 text-center animate-fade-in-up">
          <p className="text-indigo-200 text-sm">
            <button onClick={() => signIn('discord')} className="underline font-semibold cursor-pointer">
              Login with Discord
            </button>{' '}
            to submit guesses and appear on the leaderboard.
          </p>
        </div>
      )}

      <div className="border border-zinc-600 max-w-xl w-full bg-zinc-700 rounded-2xl p-8 mb-8 shadow-xl animate-fade-in-up">
        <p className="text-xl italic text-gray-100 leading-relaxed">
          "{game.quoteText}"
        </p>
        <p className="mt-4 text-gray-500 text-sm text-right">
          — {game.gameOver ? (
            <span className={game.solved ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {game.revealedAuthor}
              {hasAka && (
                <span className="text-gray-400 text-xs font-normal ml-1">(aka {game.revealedNickname})</span>
              )}
            </span>
          ) : '???'}
        </p>
      </div>

      {game.gameOver && (
        <div className={`w-full max-w-xl rounded-xl p-4 mb-6 text-center font-semibold animate-fade-in-up ${
          game.solved ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
        }`}>
          {game.solved
            ? `Got it in ${game.guesses.length} guess${game.guesses.length === 1 ? '' : 'es'}!`
            : `Better luck tomorrow! It was ${game.revealedAuthor}${hasAka ? ` (aka ${game.revealedNickname})` : ''}.`
          }
        </div>
      )}

      {game.guesses.length > 0 && (
        <div className="w-full max-w-xl mb-8 mt-10 animate-fade-in-up">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Your guesses</p>
          <div className="flex flex-wrap gap-2">
            {game.guesses.map((guess, i) => {
              const isCorrect = game.solved && i === game.guesses.length - 1;
              return (
                <span key={guess} className={`px-3 py-1 rounded-xl text-sm font-medium ${
                  isCorrect ? 'bg-green-700 text-green-100' : 'bg-red-900 text-red-200 line-through'
                }`}>
                  {guess}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {!game.gameOver && (
        session ? (
          <div className="w-full max-w-xl mt-10 animate-fade-in-up">
  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
    {remainingGuesses} guess{remainingGuesses === 1 ? '' : 'es'} remaining
  </p>

  <div className="grid grid-cols-2 gap-2">
    {availableOptions.map((option, index) => {
      const isLast = index === availableOptions.length - 1;
      const isOddCount = availableOptions.length % 2 !== 0;

      return (
        <button
          key={option.username}
          onClick={() => game.makeGuess(option.username)}
          style={{ animationDelay: `${index * 40}ms` }}
          className={`
            px-4 py-2
            border border-zinc-600
            bg-zinc-700 hover:bg-zinc-600
            text-white rounded-xl text-sm
            transition-all duration-150 ease-out
            will-change-transform
            hover:scale-103 active:scale-95
            cursor-pointer
            animate-fade-in-up
            ${isLast && isOddCount ? 'col-span-2' : ''}
          `}
        >
          {option.username}
          {option.nickname && option.nickname !== option.username && (
            <span className="text-gray-400 text-xs ml-1">
              (aka {option.nickname})
            </span>
          )}
        </button>
      );
    })}
  </div>
</div>
        ) : (
          <p className="mt-10 text-gray-500 text-sm">No confidants were harmed in the making of KeksDeedle.</p>
        )
      )}
    </main>
  );
}