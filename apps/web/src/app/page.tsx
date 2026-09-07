'use client';

import { useSession, signIn } from 'next-auth/react';
import { useGame } from '@/hooks/useGame';
import { MAX_GUESSES } from '@/lib/constants';

export default function HomePage() {
  const { data: session, status } = useSession();
  const game = useGame();

  if (status === 'loading' || game.loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </main>
    );
  }

  const remainingGuesses = MAX_GUESSES - game.guesses.length;
  const availableOptions = game.options.filter(o => !game.guesses.includes(o.username));

  return (
    <main className="flex-1 bg-gray-950 text-white flex flex-col items-center py-10 px-4">
      <h2 className="text-xl font-semibold text-gray-300 mb-6">Today's Quote</h2>

      {!session && (
        <div className="w-full max-w-xl bg-indigo-900/40 border border-indigo-700 rounded-xl p-4 mb-6 text-center">
          <p className="text-indigo-200 text-sm">
            <button onClick={() => signIn('discord')} className="underline font-semibold">
              Login with Discord
            </button>{' '}
            to submit guesses and appear on the leaderboard.
          </p>
        </div>
      )}

      <div className="max-w-xl w-full bg-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
        <p className="text-xl italic text-gray-100 leading-relaxed">
          "{game.quoteText}"
        </p>
        <p className="mt-4 text-gray-500 text-sm text-right">
          — {game.gameOver ? (
            <span className={game.solved ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {game.revealedAuthor}
            </span>
          ) : '???'}
        </p>
      </div>

      {game.gameOver && (
        <div className={`w-full max-w-xl rounded-xl p-4 mb-6 text-center font-semibold ${
          game.solved ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
        }`}>
          {game.solved
            ? `Got it in ${game.guesses.length} guess${game.guesses.length === 1 ? '' : 'es'}!`
            : `Better luck tomorrow! It was ${game.revealedAuthor}.`
          }
        </div>
      )}

      {game.guesses.length > 0 && (
        <div className="w-full max-w-xl mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Your guesses</p>
          <div className="flex flex-wrap gap-2">
            {game.guesses.map((guess, i) => {
              const isCorrect = game.solved && i === game.guesses.length - 1;
              return (
                <span key={guess} className={`px-3 py-1 rounded-full text-sm font-medium ${
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
          <div className="w-full max-w-xl">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
              {remainingGuesses} guess{remainingGuesses === 1 ? '' : 'es'} remaining — pick a name
            </p>
            <div className="flex flex-wrap gap-2">
              {availableOptions.map(option => (
                <button
                  key={option.username}
                  onClick={() => game.makeGuess(option.username)}
                  className="px-4 py-2 bg-gray-700 hover:bg-indigo-600 text-white rounded-full text-sm transition-colors duration-150 cursor-pointer"
                >
                  {option.username}
                  {option.nickname && option.nickname !== option.username && (
                    <span className="text-gray-400 text-xs ml-1">(aka {option.nickname})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Sign in with Discord above to submit a guess.</p>
        )
      )}
    </main>
  );
}