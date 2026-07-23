import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const TIME_SLOTS = ["20:00", "21:00", "22:00", "23:00"];
const END_SLOTS = ["06:00", "07:00", "08:00", "09:00"];

composer.callbackQuery("quiet:configure", async (ctx) => {
  await ctx.answerCallbackQuery();
  const start = ctx.session.settings.quietHoursStart;
  const end = ctx.session.settings.quietHoursEnd;
  ctx.session.step = "setting_quiet_start";
  await ctx.reply(
    `Set quiet hours to pause notifications during certain times.\n\nCurrent quiet hours: ${start} — ${end}\n\nChoose when quiet hours start:`,
    {
      reply_markup: inlineKeyboard([
        TIME_SLOTS.map((t) => inlineButton(t, `quiet:start:${t}`)),
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery(/^quiet:start:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const start = ctx.match[1];
  ctx.session.flowData = { quietStart: start };
  ctx.session.step = "setting_quiet_end";
  await ctx.reply("Now choose when quiet hours end:", {
    reply_markup: inlineKeyboard([
      END_SLOTS.map((t) => inlineButton(t, `quiet:end:${t}`)),
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^quiet:end:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const end = ctx.match[1];
  const fd = ctx.session.flowData as { quietStart: string } | undefined;
  const start = fd?.quietStart ?? ctx.session.settings.quietHoursStart;
  ctx.session.settings.quietHoursStart = start;
  ctx.session.settings.quietHoursEnd = end;
  ctx.session.step = "idle";
  ctx.session.flowData = undefined;
  await ctx.reply(`✅ Quiet hours set: ${start} — ${end}. Notifications paused during this time.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
