import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "📊 Prices", data: "price:show", order: 10 });
registerMainMenuItem({ label: "📋 Watchlist", data: "watchlist:show", order: 20 });
registerMainMenuItem({ label: "➕ Add coin", data: "watchlist:add", order: 30 });
registerMainMenuItem({ label: "🔔 Set alert", data: "alert:create", order: 40 });
registerMainMenuItem({ label: "🌅 Summary", data: "summary:enable", order: 50 });
registerMainMenuItem({ label: "⏰ Quiet hours", data: "quiet:configure", order: 60 });

const composer = new Composer<Ctx>();

const WELCOME = "👋 Welcome to Crypto Tracker!\n\nTrack your favorite coins, set price alerts, and get daily summaries — all from Telegram.";

composer.command("start", async (ctx) => {
  ctx.session.step = "idle";
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
