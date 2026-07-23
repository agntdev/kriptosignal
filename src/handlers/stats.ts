import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

composer.command("stats", async (ctx) => {
  const ownerId = process.env.OWNER_ID;
  if (ownerId && ctx.from?.id !== Number(ownerId)) {
    await ctx.reply("This command is for the bot owner only.");
    return;
  }
  const watchlistCount = ctx.session.watchlist.length;
  const alertCount = ctx.session.alerts.length;
  await ctx.reply(
    `📊 Bot statistics\n\nWatchlists: ${watchlistCount}\nActive alerts: ${alertCount}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
