/* 
    TODO:
    - [ ] parseQuote does not parse from every case
*/

require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

/* Clients */

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

// ─── Quote Parsing ────────────────────────────────────────────────────────────
//
// Parses a Discord message into a quote object.
//
// Your quotes channel may have a specific format. Adjust the regex below to
// match how quotes are posted in your server.
//
// Common formats:
//   "Quote text" — Username
//   **Username**: Quote text
//   Quote text ~ Username
//
// The default regex below handles: "quote text" — Username

function parseQuote(message) {
  const content = message.content.trim();

  // Handles: `"quote text"` -@Username, July 17th, 2026
  // - optional leading/trailing backtick (inline code formatting)
  // - straight or curly quotes around the text
  // - dash (regular or em/en) then optional @ before the username
  // - username captured up to the first comma (rest is the date, discarded)
  const match = content.match(/^`?["""](.+?)["""]`?\s*[-—–]\s*@?([^,]+)/s);

  if (!match) return null;

  return {
    discord_id: message.id,
    text: match[1].trim(),
    author: match[2].trim(),
    author_id: message.author.id,
    posted_by: message.author.username,
    created_at: message.createdAt.toISOString(),
  };
}

// ─── Save Quote ───────────────────────────────────────────────────────────────

async function saveQuote(quote) {
  const { error } = await supabase
    .from('quotes')
    .upsert(quote, { onConflict: 'discord_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error saving quote:', error.message);
  } else {
    console.log(`Saved quote by${quote.author}: "${quote.text.slice(0, 50)}..."`);
  }
}

// ─── Backfill ─────────────────────────────────────────────────────────────────
//
// On startup, fetch all existing messages from the quotes channel and store
// any that aren't already in the database.

async function backfill(channel) {
  console.log('Starting backfill ...');
  let lastId = null;
  let total = 0;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;

    for (const message of messages.values()) {
      const quote = parseQuote(message);
      if (quote) {
        await saveQuote(quote);
        total++;
      }
    }

    lastId = messages.last().id;
    console.log(`Backfilled ${total} quotes so far ...`);

    // Avoid hitting Discord rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Backfill complete. Total quotes saved: ${total}`);
}

// ─── Bot Events ───────────────────────────────────────────────────────────────

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

  const quote = parseQuote(message);
  if (quote) await saveQuote(quote);
});

// Log in
client.login(process.env.DISCORD_TOKEN);