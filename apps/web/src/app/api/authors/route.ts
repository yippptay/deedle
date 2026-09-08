import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Returns a deduplicated list of all authors (for the guess picker)
export async function GET() {
  const { data, error } = await supabase
    .from('quotes')
    .select('author')
    .order('author');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authors = [...new Set(data.map((q: { author: string }) => q.author))].sort();
  return NextResponse.json({ authors });
}