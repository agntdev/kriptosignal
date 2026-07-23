import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const TIMES = ["07:00", "08:00", "09:00", "10:00"];

composer.callbackQuery("summary:enable", async (ctx) => {
  await ctx.answerCallbackQuery();
  const enabled = ctx.session.settings.morningSummaryEnabled;
  if (enabled) {
    await ctx.reply(
      `🌅 Morning summary is ON.\n\nYou'll receive a market overview each morning at ${ctx.session.settings.morningSummaryTime}.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("Turn off", "summary:toggle")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
  } else {
    const rows = TIMES.map((t) => [inlineButton(`Set for ${t}`, `summary:set:${t}`)]);
    rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
    await ctx.reply("🌅 Morning summary is currently OFF.\n\nTap to enable a daily market overview of your watchlist.", {
      reply_markup: inlineKeyboard(rows),
    });
  }
});

composer.callbackQuery("summary:toggle", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.settings.morningSummaryEnabled = false;
  await ctx.reply("🌅 Morning summary turned off.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.callbackQuery(/^summary:set:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const time = ctx.match[1];
  ctx.session.settings.morningSummaryEnabled = true;
  ctx.session.settings.morningSummaryTime = time;
  await ctx.reply(`🌅 Morning summary set for ${time}. You'll receive a market overview each morning.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
