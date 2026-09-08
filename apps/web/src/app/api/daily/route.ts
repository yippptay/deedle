import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MAX_GUESSES } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const NUM_OPTIONS = 6;

// Deterministic PRNG (mulberry32) so the decoy set and button order stay
// stable across refreshes for the same day's quote, instead of reshuffling
// on every request. Re-seeding with a new quote id each day still gives a
// fresh random shuffle daily.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  const { data, error } = await supabase.rpc('get_or_set_daily_quote');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || !data.author) {
    return NextResponse.json({ error: 'No quote available today' }, { status: 404 });
  }

  const { data: authorRows, error: authorsError } = await supabase
    .from('quotes')
    .select('author, author_nickname')
    .neq('author', data.author);

  if (authorsError) {
    return NextResponse.json({ error: authorsError.message }, { status: 500 });
  }

  const seen = new Map<string, string | null>();
  for (const row of authorRows as { author: string; author_nickname: string | null }[]) {
    if (!seen.has(row.author)) seen.set(row.author, row.author_nickname ?? null);
  }
  const otherOptions = Array.from(seen, ([username, nickname]) => ({ username, nickname }));
  const rng = mulberry32(hashString(data.id));
  const shuffledOthers = seededShuffle(otherOptions, rng);
  const decoys = shuffledOthers.slice(0, NUM_OPTIONS - 1);

  const correctOption = { username: data.author, nickname: data.author_nickname ?? null };
  const options = seededShuffle([...decoys, correctOption], rng);

  // Check whether the signed-in user already has progress on today's quote
  const session = await auth();
  let guesses: string[] = [];
  let solved = false;

  if (session?.user) {
    const userId = (session.user as any).id;
    const today = new Date().toISOString().split('T')[0];
    const { data: gameSession } = await supabase
      .from('game_sessions')
      .select('guesses, solved')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (gameSession) {
      guesses = gameSession.guesses;
      solved = gameSession.solved;
    }
  }

  const gameOver = solved || guesses.length >= MAX_GUESSES;

  return NextResponse.json({
    id: data.id,
    text: data.text,
    options,
    guesses,
    solved,
    gameOver,
    author: gameOver ? data.author : null,
    authorNickname: gameOver ? (data.author_nickname ?? null) : null,
  });
}