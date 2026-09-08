require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// ─── Clients ────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── Blacklist ──────────────────────────────────────────────────────────
// Message IDs listed here are skipped entirely — never saved, never counted.
// To find a message ID: enable Developer Mode (User Settings → Advanced),
// then right-click the message → Copy Message ID.
const BLACKLISTED_MESSAGE_IDS = new Set([
  '298612232147697665',
  '413226091852070943',
  '298612990343905303',
  '359587380761460747',
  '299033918622007296',
  '362811382300672001',
  '1445832397525614738'
]);

// Usernames listed here are never saved as a quote author, regardless of
// how the quote was posted (plain text or @mention). Case-insensitive.
const BLACKLISTED_AUTHORS = new Set([
  'Deleted User',
  'jutterflyboe',
  'basedlokix',
  'nc777',
  'mricecube',
  'sakura_haru',
  'paran.neko'
]);

// Avoid re-fetching the same guild member repeatedly during backfill
const nicknameCache = new Map();

async function getNickname(guild, userId) {
  if (nicknameCache.has(userId)) return nicknameCache.get(userId);
  try {
    const member = await guild.members.fetch(userId);
    const nickname = member.nickname ?? null; // null if they haven't set one
    nicknameCache.set(userId, nickname);
    return nickname;
  } catch {
    // User may have left the server, or fetch failed — just skip the nickname
    nicknameCache.set(userId, null);
    return null;
  }
}

// ─── Quote Parsing ──────────────────────────────────────────────────────
//
// Handles: `"quote text"` -@Username, July 17th, 2026
// - optional leading/trailing backtick (inline code formatting)
// - straight or curly quotes around the text
// - dash (regular or em/en) then optional @ before the username
// - username captured up to the first comma (rest is the date, discarded)

async function parseQuote(message) {
  if (BLACKLISTED_MESSAGE_IDS.has(message.id)) return null;

  const content = message.content.trim();
  const match = content.match(/^`?["""](.+?)["""]`?\s*[-—–]\s*@?([^,]+)/s);
  if (!match) return null;

  let author = match[2].trim();
  let authorId = message.author.id;
  let authorNickname = null;

  const mentionMatch = author.match(/^<@!?(\d+)>$/);
  if (mentionMatch) {
    const mentionedUser = message.mentions.users.get(mentionMatch[1]);
    if (!mentionedUser) return null;
    author = mentionedUser.username;
    authorId = mentionedUser.id;

    if (message.guild) {
      authorNickname = await getNickname(message.guild, mentionedUser.id);
    }
  }

  // Check the blacklist against the FINAL resolved author, so it works
  // whether the quote came in as plain text or as a resolved @mention.
  if (BLACKLISTED_AUTHORS.has(author)) return null;

  return {
    discord_id: message.id,
    text: match[1].trim(),
    author,
    author_id: authorId,
    author_nickname: authorNickname,
    posted_by: message.author.username,
    created_at: message.createdAt.toISOString(),
  };
}

// ─── Save Quote ─────────────────────────────────────────────────────────
async function saveQuote(quote) {
  const { error } = await supabase
    .from('quotes')
    .upsert(quote, { onConflict: 'discord_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error saving quote:', error.message);
  } else {
    console.log(`Saved quote by ${quote.author}: "${quote.text.slice(0, 50)}..."`);
  }
}

// ─── Backfill ───────────────────────────────────────────────────────────
//
// On startup, fetch all existing messages from the quotes channel and store
// any that aren't already in the database.

async function backfill(channel) {
  console.log('Starting backfill...');
  let lastId = null;
  let total = 0;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;

    for (const message of messages.values()) {
      const quote = await parseQuote(message);
      if (quote) {
        await saveQuote(quote);
        total++;
      }
    }

    lastId = messages.last().id;
    console.log(`Backfilled ${total} quotes so far...`);

    // Avoid hitting Discord rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Backfill complete. Total quotes saved: ${total}`);
}

// ─── Bot Events ─────────────────────────────────────────────────────────
client.once(Events.ClientReady, async (bot) => {
  console.log(`Bot logged in as ${bot.user.tag}`);

  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);

  if (!channel) {
    console.error('Channel not found. Check DISCORD_CHANNEL_ID in your .env');
    process.exit(1);
  }

  console.log(`Watching channel: #${channel.name}`);

  // Backfill all historical quotes on startup
  await backfill(channel);
});

// Listen for new messages in real time
client.on(Events.MessageCreate, async (message) => {
  // Only process messages from the quotes channel
  if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;
  if (message.author.bot) return;

  const quote = await parseQuote(message);
  if (quote) await saveQuote(quote);
});

// Log in
client.login(process.env.DISCORD_TOKEN);