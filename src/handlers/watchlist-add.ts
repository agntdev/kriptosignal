import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { POPULAR_COINS, searchCoins } from "../lib/price-feed.js";

const composer = new Composer<Ctx>();

function coinKeyboard() {
  const rows = POPULAR_COINS.slice(0, 6).map((c) => [
    inlineButton(`${c.ticker} — ${c.name}`, `wl:pick:${c.id}:${c.ticker}:${c.name}`),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return inlineKeyboard(rows);
}

composer.callbackQuery("watchlist:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "adding_coin";
  await ctx.reply("Pick a coin to add, or type a ticker symbol.", {
    reply_markup: coinKeyboard(),
  });
});

composer.callbackQuery(/^wl:pick:(.+):(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const [, coinId, ticker, name] = ctx.match;
  const already = ctx.session.watchlist.some((w) => w.id === coinId);
  if (already) {
    await ctx.reply(`${ticker} is already on your watchlist.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  ctx.session.watchlist.push({
    id: coinId,
    ticker,
    name,
    addedAt: Date.now(),
  });
  ctx.session.step = "idle";
  await ctx.reply(`✅ Added ${ticker} (${name}) to your watchlist.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "adding_coin") return next();
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return next();

  const existing = ctx.session.watchlist.find(
    (w) => w.ticker.toUpperCase() === text.toUpperCase(),
  );
  if (existing) {
    await ctx.reply(`${existing.ticker} is already on your watchlist.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    ctx.session.step = "idle";
    return;
  }

  let results;
  try {
    results = await searchCoins(text);
  } catch {
    await ctx.reply("Couldn't search for that coin. Check the spelling and try again.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    ctx.session.step = "idle";
    return;
  }

  if (results.length === 0) {
    await ctx.reply(`Couldn't find "${text}". Check the spelling and try again.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    ctx.session.step = "idle";
    return;
  }

  const coin = results[0];
  ctx.session.watchlist.push({
    id: coin.id,
    ticker: coin.ticker,
    name: coin.name,
    addedAt: Date.now(),
  });
  ctx.session.step = "idle";
  await ctx.reply(`✅ Added ${coin.ticker} (${coin.name}) to your watchlist.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
