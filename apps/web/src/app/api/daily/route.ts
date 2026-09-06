import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service key server-side so we can call the function
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // Add this to .env.local too
);

export async function GET() {
  const { data, error } = await supabase.rpc('get_or_set_daily_quote');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the quote but HIDE the author — the client never sees it directly
  // The author is only revealed after the game ends
  return NextResponse.json({
    id: data.id,
    text: data.text,
    // Author is intentionally omitted here
  });
}