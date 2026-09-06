import { useState, useEffect } from 'react';

const MAX_GUESSES = 2;

export interface GuessOption {
  username: string;
  nickname: string | null;
}

export interface GameState {
  quoteText: string | null;
  options: GuessOption[];
  guesses: string[];
  solved: boolean;
  gameOver: boolean;
  revealedAuthor: string | null;
  loading: boolean;
  makeGuess: (author: string) => Promise<void>;
}

export function useGame(): GameState {
  const [quoteText, setQuoteText] = useState<string | null>(null);
  const [options, setOptions] = useState<GuessOption[]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [revealedAuthor, setRevealedAuthor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/daily');
      const quote = await res.json();

      setQuoteText(quote.text);
      setOptions(quote.options ?? []);
      setLoading(false);
    }
    init();
  }, []);

  async function makeGuess(author: string) {
    if (gameOver || guesses.includes(author)) return;

    const res = await fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: author }),
    });

    const data = await res.json();
    setGuesses(data.guesses);
    setSolved(data.correct);
    setGameOver(data.gameOver);
    if (data.author) setRevealedAuthor(data.author);
  }

  return { quoteText, options, guesses, solved, gameOver, revealedAuthor, loading, makeGuess };
}