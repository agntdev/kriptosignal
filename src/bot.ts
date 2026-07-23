import { Composer } from "grammy";
import { createBot, type BotContext, type CreateBotOptions } from "./toolkit/index.js";
import type { StorageAdapter } from "grammy";

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  addedAt: number;
}

export interface PriceAlert {
  id: string;
  ticker: string;
  coinId: string;
  type: "price_above" | "price_below" | "percent_change";
  targetValue: number;
  active: boolean;
  createdAt: number;
}

export interface UserSettings {
  timezone: string;
  morningSummaryEnabled: boolean;
  morningSummaryTime: string;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface Session {
  step?: string;
  flowData?: Record<string, unknown>;
  watchlist: WatchlistItem[];
  alerts: PriceAlert[];
  settings: UserSettings;
  alertCooldowns: Record<string, number>;
  lastSummarySentAt?: number;
}

export type Ctx = BotContext<Session>;

export interface BuildBotOptions {
  handlers?: Composer<Ctx>[];
  storage?: StorageAdapter<Session>;
  telemetryEnv?: CreateBotOptions<Session>["telemetryEnv"];
  telemetryReporterOptions?: CreateBotOptions<Session>["telemetryReporterOptions"];
}

export async function buildBot(token: string, opts: BuildBotOptions = {}) {
  const bot = createBot<Session>(token, {
    initial: () => ({
      watchlist: [],
      alerts: [],
      settings: {
        timezone: "UTC",
        morningSummaryEnabled: false,
        morningSummaryTime: "08:00",
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
      },
      alertCooldowns: {},
    }),
    storage: opts.storage,
    telemetryEnv: opts.telemetryEnv,
    telemetryReporterOptions: opts.telemetryReporterOptions,
  });

  const handlers = opts.handlers ?? (await loadHandlersFromDisk());
  for (const h of handlers) bot.use(h);

  bot.on("message", (ctx) => ctx.reply("Sorry, I didn't understand that. Try /help."));

  return bot;
}

async function loadHandlersFromDisk(): Promise<Composer<Ctx>[] > {
  const { readdirSync } = await import("node:fs");
  const dir = new URL("./handlers/", import.meta.url);
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (f) =>
        (f.endsWith(".js") || f.endsWith(".ts")) &&
        !f.endsWith(".d.ts") &&
        !f.includes(".test.") &&
        !f.includes(".spec."),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    files = [];
  }
  const out: Composer<Ctx>[] = [];
  for (const file of files.sort()) {
    const mod = (await import(new URL(file, dir).href)) as { default?: Composer<Ctx> };
    if (!mod.default) {
      throw new Error(`handler ${file} must default-export a grammY Composer`);
    }
    out.push(mod.default);
  }
  return out;
}
