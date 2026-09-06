'use client';

import { useGame } from '@/hooks/useGame';

const MAX_GUESSES = 5;

// For now, use a placeholder user. Replace with real auth in Section 7.
const TEMP_USER = { id: 'guest', username: 'Guest' };

export default function HomePage() {
  const game = useGame(TEMP_USER.id, TEMP_USER.username);

  if (game.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400 animate-pulse">Loading today's quote...</p>
      </main>
    );
  }

  const remainingGuesses = MAX_GUESSES - game.guesses.length;
  const availableAuthors = game.authors.filter(a => !game.guesses.includes(a));

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-16 px-4">
      <h1 className="text-3xl font-bold mb-2 tracking-tight">Who Said It?</h1>
      <p className="text-gray-400 mb-10 text-sm">Guess the author of today's quote</p>

      {/* Quote Card */}
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

      {/* Game Over Banner */}
      {game.gameOver && (
        <div className={`w-full max-w-xl rounded-xl p-4 mb-6 text-center font-semibold ${
          game.solved
            ? 'bg-green-900 text-green-200'
            : 'bg-red-900 text-red-200'
        }`}>
          {game.solved
            ? `✅ Nice! You got it in ${game.guesses.length} guess${game.guesses.length === 1 ? '' : 'es'}!`
            : `❌ Better luck tomorrow! It was ${game.revealedAuthor}.`
          }
        </div>
      )}

      {/* Guess History */}
      {game.guesses.length > 0 && (
        <div className="w-full max-w-xl mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Your guesses</p>
          <div className="flex flex-wrap gap-2">
            {game.guesses.map((guess, i) => {
              const isLast = i === game.guesses.length - 1;
              const isCorrect = game.solved && isLast;
              return (
                <span
                  key={guess}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isCorrect
                      ? 'bg-green-700 text-green-100'
                      : 'bg-red-900 text-red-200 line-through'
                  }`}
                >
                  {guess}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Guess Picker */}
      {!game.gameOver && (
        <div className="w-full max-w-xl">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            {remainingGuesses} guess{remainingGuesses === 1 ? '' : 'es'} remaining
          </p>
          <div className="flex flex-wrap gap-2">
            {availableAuthors.map(author => (
              <button
                key={author}
                onClick={() => game.makeGuess(author)}
                className="px-4 py-2 bg-gray-700 hover:bg-indigo-600 text-white rounded-full text-sm transition-colors duration-150 cursor-pointer"
              >
                {author}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}