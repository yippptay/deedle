import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const NUM_OPTIONS = 6;

export async function GET() {
  const { data, error } = await supabase.rpc('get_or_set_daily_quote');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || !data.author) {
    return NextResponse.json({ error: 'No quote available today' }, { status: 404 });
  }

  // Pull distinct authors (with nickname, if known) other than today's correct one
  const { data: authorRows, error: authorsError } = await supabase
    .from('quotes')
    .select('author, author_nickname')
    .neq('author', data.author);

  if (authorsError) {
    return NextResponse.json({ error: authorsError.message }, { status: 500 });
  }

  // Dedupe by username, keeping the first nickname seen for that username
  const seen = new Map<string, string | null>();
  for (const row of authorRows as { author: string; author_nickname: string | null }[]) {
    if (!seen.has(row.author)) seen.set(row.author, row.author_nickname ?? null);
  }
  const otherOptions = Array.from(seen, ([username, nickname]) => ({ username, nickname }));

  const shuffledOthers = otherOptions.sort(() => Math.random() - 0.5);
  const decoys = shuffledOthers.slice(0, NUM_OPTIONS - 1);

  const correctOption = { username: data.author, nickname: data.author_nickname ?? null };
  const options = [...decoys, correctOption].sort(() => Math.random() - 0.5);

  return NextResponse.json({
    id: data.id,
    text: data.text,
    options,
    // Author is intentionally omitted here — only revealed after the game ends
  });
}