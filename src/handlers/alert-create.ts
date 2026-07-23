import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function coinPickerKeyboard(watchlist: { id: string; ticker: string; name: string }[]) {
  if (watchlist.length === 0) {
    return inlineKeyboard([
      [inlineButton("➕ Add coins first", "watchlist:add")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]);
  }
  const rows = watchlist.map((w) => [
    inlineButton(`${w.ticker} — ${w.name}`, `alert:coin:${w.id}:${w.ticker}:${w.name}`),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return inlineKeyboard(rows);
}

function alertTypeKeyboard(coinId: string, ticker: string, name: string) {
  return inlineKeyboard([
    [inlineButton("📈 Price above", `alert:type:${coinId}:${ticker}:${name}:price_above`)],
    [inlineButton("📉 Price below", `alert:type:${coinId}:${ticker}:${name}:price_below`)],
    [inlineButton("📊 Percent change", `alert:type:${coinId}:${ticker}:${name}:percent_change`)],
    [inlineButton("⬅️ Back", "alert:create")],
  ]);
}

composer.callbackQuery("alert:create", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.alerts.length >= 10) {
    await ctx.reply("You've reached the maximum number of alerts (10). Remove some first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  ctx.session.step = "creating_alert";
  await ctx.reply("Which coin do you want an alert for?", {
    reply_markup: coinPickerKeyboard(ctx.session.watchlist),
  });
});

composer.callbackQuery(/^alert:coin:(.+):(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const [, coinId, ticker, name] = ctx.match;
  ctx.session.flowData = { coinId, ticker, name };
  ctx.session.step = "choosing_alert_type";
  await ctx.reply(`What kind of alert for ${ticker}?`, {
    reply_markup: alertTypeKeyboard(coinId, ticker, name),
  });
});

composer.callbackQuery(/^alert:type:(.+):(.+):(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const [, coinId, ticker, name, alertType] = ctx.match;
  ctx.session.flowData = { coinId, ticker, name, alertType };
  ctx.session.step = "setting_alert_value";
  const label =
    alertType === "price_above"
      ? "price above"
      : alertType === "price_below"
        ? "price below"
        : "percent change";
  await ctx.reply(`Enter the target ${label} (e.g. ${alertType === "percent_change" ? "5" : "70000"}):`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", "alert:create")]]),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "setting_alert_value") return next();
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return next();

  const value = parseFloat(text);
  if (isNaN(value) || value <= 0) {
    await ctx.reply("Enter a valid number (e.g. 70000 or 5).", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", "alert:create")]]),
    });
    return;
  }

  const fd = ctx.session.flowData as {
    coinId: string;
    ticker: string;
    name: string;
    alertType: string;
  } | undefined;
  if (!fd) {
    ctx.session.step = "idle";
    await ctx.reply("Something went wrong. Tap 🔔 Set alert to try again.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const alert = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ticker: fd.ticker,
    coinId: fd.coinId,
    type: fd.alertType as "price_above" | "price_below" | "percent_change",
    targetValue: value,
    active: true,
    createdAt: Date.now(),
  };
  ctx.session.alerts.push(alert);
  ctx.session.step = "idle";
  ctx.session.flowData = undefined;

  const typeLabel =
    alert.type === "price_above"
      ? `above $${value}`
      : alert.type === "price_below"
        ? `below $${value}`
        : `±${value}%`;
  await ctx.reply(`✅ Alert created: ${fd.ticker} ${typeLabel}. You'll be notified when the condition is met.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
