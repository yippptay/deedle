import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const dynamic = 'force-dynamic'; // always show current standings, never cache

export default async function LeaderboardPage() {
  const { data: rows, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('games_won', { ascending: false })
    .order('current_streak', { ascending: false })
    .limit(50);

  return (
    <main className="flex-1 bg-gray-950 text-white flex flex-col items-center py-10 px-4">
      <h2 className="text-xl font-semibold text-gray-300 mb-1">Leaderboard</h2>
      <p className="text-gray-500 text-sm mb-8">Top guessers, ranked by wins</p>

      {error && <p className="text-red-400 text-sm">Couldn't load the leaderboard.</p>}

      {!error && (!rows || rows.length === 0) && (
        <p className="text-gray-500 text-sm">No games played yet — be the first!</p>
      )}

      {!error && rows && rows.length > 0 && (
        <div className="w-full max-w-xl bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 text-gray-300 uppercase text-xs tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Player</th>
                <th className="text-right px-4 py-3">Wins</th>
                <th className="text-right px-4 py-3">Played</th>
                <th className="text-right px-4 py-3">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.user_id} className="border-t border-gray-700">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{row.username}</td>
                  <td className="px-4 py-3 text-right text-green-400">{row.games_won}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{row.games_played}</td>
                  <td className="px-4 py-3 text-right text-indigo-400">{row.current_streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}