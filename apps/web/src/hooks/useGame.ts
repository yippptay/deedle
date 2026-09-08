import { useState, useEffect } from 'react';

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
  revealedNickname: string | null;
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
  const [revealedNickname, setRevealedNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/daily');
      const quote = await res.json();

      setQuoteText(quote.text);
      setOptions(quote.options ?? []);
      setGuesses(quote.guesses ?? []);
      setSolved(quote.solved ?? false);
      setGameOver(quote.gameOver ?? false);
      if (quote.author) {
        setRevealedAuthor(quote.author);
        setRevealedNickname(quote.authorNickname ?? null);
      }
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
    if (data.author) {
      setRevealedAuthor(data.author);
      setRevealedNickname(data.authorNickname ?? null);
    }
  }

  return { quoteText, options, guesses, solved, gameOver, revealedAuthor, revealedNickname, loading, makeGuess };
}