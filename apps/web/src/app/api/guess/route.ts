import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const { guess, userId, username } = await req.json();
  const today = new Date().toISOString().split('T')[0];

  // Get today's actual quote
  const { data: quote } = await supabase.rpc('get_or_set_daily_quote');
  if (!quote) return NextResponse.json({ error: 'No quote today' }, { status: 404 });

  const correct = guess.toLowerCase() === quote.author.toLowerCase();

  // Load or create the session
  let { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (!session) {
    const { data: newSession } = await supabase
      .from('game_sessions')
      .insert({ user_id: userId, username, date: today, guesses: [guess] })
      .select()
      .single();
    session = newSession;
  } else {
    // Add the guess if not already made
    if (!session.guesses.includes(guess)) {
      const guesses = [...session.guesses, guess];
      const solved = correct;
      await supabase
        .from('game_sessions')
        .update({ guesses, solved })
        .eq('id', session.id);
      session = { ...session, guesses, solved };
    }
  }

  const MAX_GUESSES = 5;
  const gameOver = correct || session.guesses.length >= MAX_GUESSES;

  return NextResponse.json({
    correct,
    guesses: session.guesses,
    gameOver,
    // Only reveal the author when the game is over
    author: gameOver ? quote.author : null,
  });
}