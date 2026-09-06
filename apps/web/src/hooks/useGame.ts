import { useState, useEffect } from 'react';

const MAX_GUESSES = 5;

export interface GameState {
  quoteText: string | null;
  authors: string[];
  guesses: string[];
  solved: boolean;
  gameOver: boolean;
  revealedAuthor: string | null;
  loading: boolean;
  makeGuess: (author: string) => Promise<void>;
}

export function useGame(): GameState {
  const [quoteText, setQuoteText] = useState<string | null>(null);
  const [authors, setAuthors] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [revealedAuthor, setRevealedAuthor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [quoteRes, authorsRes] = await Promise.all([
        fetch('/api/daily'),
        fetch('/api/authors'),
      ]);
      const quote = await quoteRes.json();
      const { authors } = await authorsRes.json();

      setQuoteText(quote.text);
      setAuthors(authors);
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

  return { quoteText, authors, guesses, solved, gameOver, revealedAuthor, loading, makeGuess };
}