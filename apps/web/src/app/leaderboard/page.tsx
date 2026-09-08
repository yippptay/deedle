import { createClient } from '@supabase/supabase-js';
import { CrownIcon } from '@/components/CrownIcon';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const dynamic = 'force-dynamic';

interface LeaderboardRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  best_streak: number;
  games_won: number;
}

function Avatar({ row, size }: { row: LeaderboardRow; size: string }) {
  return row.avatar_url ? (
    <img src={row.avatar_url} alt="" className={`${size} rounded-full flex-shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-semibold flex-shrink-0`}>
      {row.username?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// The two numbers shown next to every name: highest streak (the ranking
// stat) and total wins.
function Stats({ row, size = 'text-sm' }: { row: LeaderboardRow; size?: string }) {
  return (
    <span className={`flex items-center gap-2 ${size} font-semibold whitespace-nowrap`}>
      <span className="text-indigo-400">{row.best_streak}</span>
      <span className="text-green-400">{row.games_won}W</span>
    </span>
  );
}

export default async function LeaderboardPage() {
  const { data: rows, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, avatar_url, best_streak, games_won')
    .order('best_streak', { ascending: false })
    .order('games_won', { ascending: false })
    .limit(50);

  const first = rows?.[0];
  const secondAndThird = rows?.slice(1, 3) ?? [];
  const rest = rows?.slice(3) ?? [];

  return (
    <main className="flex-1 bg-zinc-800 text-white flex flex-col items-center py-10 px-4">
      <h2 className="text-xl font-semibold text-gray-300 mb-1">Leaderboard</h2>
      <p className="text-gray-500 text-sm mb-8">If you ain&apos;t first, you&apos;re last.</p>

      {error && <p className="text-red-400 text-sm">Couldn&apos;t load the leaderboard.</p>}

      {!error && (!rows || rows.length === 0) && (
        <p className="text-gray-500 mt-10 text-sm text-center">No games played yet. What is this a kill screen?</p>
      )}

      {!error && rows && rows.length > 0 && (
        <div className="w-full max-w-xl flex flex-col gap-3">
          {/* 1st place — its own row */}
          {first && (
            <div className="flex items-center gap-4 border border-zinc-600 rounded-2xl p-5 shadow-xl animate-fade-in-up">
              <CrownIcon src="/crown.png" size={42} />
              <Avatar row={first} size="w-12 h-12" />
              <span className="flex-1 flex items-center gap-1.5 text-lg font-bold truncate">
                {first.username}
              </span>
              <Stats row={first} size="text-base" />
            </div>
          )}

          {/* 2nd and 3rd — share a row */}
          {secondAndThird.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {secondAndThird.map((row, i) => (
                <div
                  key={row.user_id}
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                  className="flex items-center gap-3 border border-zinc-600 rounded-xl p-4 animate-fade-in-up"
                >
                  <span className="text-gray-500 text-sm font-medium">{i + 2}</span>
                  <Avatar row={row} size="w-9 h-9" />
                  <span className="flex-1 text-sm font-semibold truncate">{row.username}</span>
                  <Stats row={row} size="text-xs" />
                </div>
              ))}
            </div>
          )}

          {/* Everyone else — plain list */}
          {rest.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-800 mt-2">
              {rest.map((row, i) => (
                <div
                  key={row.user_id}
                  style={{ animationDelay: `${(i + 3) * 60}ms` }}
                  className="flex items-center gap-3 py-2.5 animate-fade-in-up"
                >
                  <span className="text-gray-500 text-sm w-6 text-right">{i + 4}</span>
                  <Avatar row={row} size="w-7 h-7" />
                  <span className="flex-1 text-sm font-medium truncate">{row.username}</span>
                  <Stats row={row} size="text-xs" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}