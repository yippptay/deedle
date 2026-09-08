import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MAX_GUESSES } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const username = session.user.name ?? 'Unknown';

  const { guess } = await req.json();
  const today = new Date().toISOString().split('T')[0];

  const { data: quote } = await supabase.rpc('get_or_set_daily_quote');
  if (!quote || !quote.author) {
    return NextResponse.json({ error: 'No quote available today' }, { status: 404 });
  }

  const correct = guess.toLowerCase() === quote.author.toLowerCase();

  let { data: gameSession } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (gameSession && (gameSession.solved || gameSession.guesses.length >= MAX_GUESSES)) {
    return NextResponse.json({
      correct: gameSession.solved,
      guesses: gameSession.guesses,
      gameOver: true,
      author: quote.author,
    });
  }

  if (!gameSession) {
    const { data: newSession } = await supabase
      .from('game_sessions')
      .insert({ user_id: userId, username, date: today, guesses: [guess], solved: correct })
      .select()
      .single();
    gameSession = newSession;
  } else if (!gameSession.guesses.includes(guess)) {
    const guesses = [...gameSession.guesses, guess];
    const solved = correct;
    await supabase
      .from('game_sessions')
      .update({ guesses, solved })
      .eq('id', gameSession.id);
    gameSession = { ...gameSession, guesses, solved };
  }

  const gameOver = correct || gameSession.guesses.length >= MAX_GUESSES;

  // This request is the one that just finished the game (it wasn't finished
  // before this guess, since we'd have returned early above otherwise) —
  // record it on the leaderboard exactly once.
  if (gameOver) {
    await supabase.rpc('increment_leaderboard', {
      p_user_id: userId,
      p_username: username,
      p_won: correct,
      p_avatar_url: session.user.image ?? null,
    });
  }

  return NextResponse.json({
    correct,
    guesses: gameSession.guesses,
    gameOver,
    author: gameOver ? quote.author : null,
    authorNickname: gameOver ? (quote.author_nickname ?? null) : null,
  });
}