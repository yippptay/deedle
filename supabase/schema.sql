-- KeksDeedle (Discord Quotes Game) — Database Schema
-- Run top-to-bottom in Supabase's SQL Editor.
-- Safe to re-run in full against an existing database (uses IF NOT EXISTS / IF EXISTS guards).
--
-- This file tracks STRUCTURE only — tables, columns, functions.
-- One-time data fixes (blacklist cleanups, bad-row deletes) are not included here;
-- those were manual one-off operations, not part of the reproducible schema.

-- ═══════════════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Stores every quote from the Discord quotes channel
CREATE TABLE IF NOT EXISTS quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id  TEXT UNIQUE NOT NULL,       -- Discord message ID (prevents duplicates)
  text        TEXT NOT NULL,              -- The quote text
  author      TEXT NOT NULL,              -- Username of the person who said it
  author_id   TEXT NOT NULL,              -- Discord user ID (quoted person's, when resolvable)
  posted_by   TEXT,                       -- Who posted it to the channel (optional)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  used_on     DATE                        -- Set when this quote becomes the daily
);

-- Tracks each player's game session per day
CREATE TABLE IF NOT EXISTS game_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,              -- Discord user ID
  username    TEXT NOT NULL,              -- Discord username (for leaderboard display)
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  guesses     TEXT[] DEFAULT '{}',        -- Array of guessed names
  solved      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)                   -- One session per user per day
);

-- Leaderboard stats per user (updated via increment_leaderboard, see below)
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id         TEXT PRIMARY KEY,
  username        TEXT NOT NULL,
  games_played    INT DEFAULT 0,
  games_won       INT DEFAULT 0,
  current_streak  INT DEFAULT 0,
  best_streak     INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Column additions (added after initial table creation)
-- ═══════════════════════════════════════════════════════════════════════════

-- Server-specific nickname for the quoted person, when resolvable via @mention
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS author_nickname TEXT;

-- Discord avatar URL, captured at the moment a player finishes a game
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Picks (and locks in) a random quote for the current day.
-- Idempotent per day: repeated calls on the same day return the same quote.
-- Every quote is eligible every day, regardless of whether it's been used
-- before — used_on only records which quote is today's, not a "used" flag.
CREATE OR REPLACE FUNCTION get_or_set_daily_quote()
RETURNS quotes AS $$
DECLARE
  today DATE := CURRENT_DATE;
  result quotes;
BEGIN
  SELECT * INTO result FROM quotes WHERE used_on = today LIMIT 1;

  IF FOUND THEN
    RETURN result;
  END IF;

  SELECT * INTO result
  FROM quotes
  ORDER BY RANDOM()
  LIMIT 1;

  IF FOUND THEN
    UPDATE quotes SET used_on = today WHERE id = result.id;
    result.used_on := today;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Records the outcome of a finished game on the leaderboard, exactly once per
-- game (called from the app the moment a session transitions to gameOver).
-- Handles win/loss counts and streak tracking atomically.
DROP FUNCTION IF EXISTS increment_leaderboard(TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION increment_leaderboard(
  p_user_id TEXT,
  p_username TEXT,
  p_won BOOLEAN,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard (user_id, username, avatar_url, games_played, games_won, current_streak, best_streak)
  VALUES (
    p_user_id,
    p_username,
    p_avatar_url,
    1,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    CASE WHEN p_won THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    games_played = leaderboard.games_played + 1,
    games_won = leaderboard.games_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    current_streak = CASE WHEN p_won THEN leaderboard.current_streak + 1 ELSE 0 END,
    best_streak = GREATEST(leaderboard.best_streak, CASE WHEN p_won THEN leaderboard.current_streak + 1 ELSE 0 END),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;