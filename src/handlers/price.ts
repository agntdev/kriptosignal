import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { fetchPrices } from "../lib/price-feed.js";

const composer = new Composer<Ctx>();

function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

async function showPrices(ctx: Ctx): Promise<void> {
  const watchlist = ctx.session.watchlist;
  if (watchlist.length === 0) {
    await ctx.reply("Add some coins to your watchlist first, then check their prices.\n\nTap 📊 Prices from the menu.", {
      reply_markup: inlineKeyboard([[inlineButton("➕ Add coin", "watchlist:add")]]),
    });
    return;
  }

  const coinIds = watchlist.map((w) => w.id);
  let prices;
  try {
    prices = await fetchPrices(coinIds);
  } catch {
    await ctx.reply("Couldn't fetch prices right now. Try again in a moment.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const lines = watchlist.map((w) => {
    const p = prices.find((pr) => pr.id === w.id);
    if (!p) return `• ${w.ticker} — ${w.name}\n  Price unavailable`;
    const sign = p.change24h >= 0 ? "+" : "";
    return `• ${w.ticker} — ${w.name}\n  $${formatPrice(p.price)} (${sign}${p.change24h.toFixed(1)}% 24h)`;
  });

  await ctx.reply(lines.join("\n\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
}

composer.command("price", async (ctx) => {
  await showPrices(ctx);
});

composer.callbackQuery("price:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPrices(ctx);
});

export default composer;
