import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function formatAlerts(alerts: { ticker: string; type: string; targetValue: number }[]): string {
  if (alerts.length === 0) {
    return "No alerts set yet.\n\nTap 🔔 Set alert to create one.";
  }
  const lines = alerts.map((a) => {
    const label =
      a.type === "price_above"
        ? `above $${a.targetValue}`
        : a.type === "price_below"
          ? `below $${a.targetValue}`
          : `±${a.targetValue}%`;
    return `• ${a.ticker}: ${label}`;
  });
  return `Your alerts:\n\n${lines.join("\n")}\n\nTap an alert to manage it.`;
}

composer.callbackQuery("alert:configure", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = formatAlerts(ctx.session.alerts);
  if (ctx.session.alerts.length === 0) {
    await ctx.reply(text, {
      reply_markup: inlineKeyboard([
        [inlineButton("🔔 Set alert", "alert:create")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const rows = ctx.session.alerts.map((a) => [
    inlineButton(`${a.ticker}: ${a.type === "price_above" ? "above" : a.type === "price_below" ? "below" : "±"} $${a.targetValue}`, `alert:del:${a.id}`),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply(text, { reply_markup: inlineKeyboard(rows) });
});

composer.callbackQuery(/^alert:del:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertId = ctx.match[1];
  const idx = ctx.session.alerts.findIndex((a) => a.id === alertId);
  if (idx === -1) {
    await ctx.reply("That alert no longer exists.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  ctx.session.alerts.splice(idx, 1);
  await ctx.reply("✅ Alert deleted.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
