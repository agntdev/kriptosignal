import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function formatWatchlist(watchlist: { ticker: string; name: string }[]): string {
  if (watchlist.length === 0) {
    return "Your watchlist is empty.\n\nTap ➕ Add coin to start tracking.";
  }
  const list = watchlist.map((i) => `• ${i.ticker} — ${i.name}`).join("\n");
  return `Your watchlist:\n\n${list}\n\nTap a coin for details, or ➕ Add coin to track more.`;
}

composer.command("watchlist", async (ctx) => {
  const text = formatWatchlist(ctx.session.watchlist);
  const kb = ctx.session.watchlist.length > 0
    ? inlineKeyboard([[inlineButton("➕ Add coin", "watchlist:add")]])
    : inlineKeyboard([[inlineButton("➕ Add coin", "watchlist:add")]]);
  await ctx.reply(text, { reply_markup: kb });
});

composer.callbackQuery("watchlist:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = formatWatchlist(ctx.session.watchlist);
  const kb = ctx.session.watchlist.length > 0
    ? inlineKeyboard([[inlineButton("➕ Add coin", "watchlist:add")]])
    : inlineKeyboard([[inlineButton("➕ Add coin", "watchlist:add")]]);
  await ctx.reply(text, { reply_markup: kb });
});

export default composer;
