import { MemorySessionStorage } from "../toolkit/index.js";

interface GlobalData {
  userIds: number[];
  totalWatchlists: number;
  totalAlerts: number;
}

let store: MemorySessionStorage<GlobalData> | null = null;

function getStore(): MemorySessionStorage<GlobalData> {
  if (!store) {
    store = new MemorySessionStorage<GlobalData>();
  }
  return store;
}

export function _resetGlobalStore(): void {
  store = null;
}

export async function recordUser(userId: number): Promise<void> {
  const s = getStore();
  const data = (await s.read("global")) ?? { userIds: [], totalWatchlists: 0, totalAlerts: 0 };
  if (!data.userIds.includes(userId)) {
    data.userIds.push(userId);
    await s.write("global", data);
  }
}

export async function getStats(): Promise<{ users: number; watchlists: number; alerts: number }> {
  const s = getStore();
  const data = (await s.read("global")) ?? { userIds: [], totalWatchlists: 0, totalAlerts: 0 };
  return {
    users: data.userIds.length,
    watchlists: data.totalWatchlists,
    alerts: data.totalAlerts,
  };
}

export async function incrementWatchlists(delta: number): Promise<void> {
  const s = getStore();
  const data = (await s.read("global")) ?? { userIds: [], totalWatchlists: 0, totalAlerts: 0 };
  data.totalWatchlists += delta;
  await s.write("global", data);
}

export async function incrementAlerts(delta: number): Promise<void> {
  const s = getStore();
  const data = (await s.read("global")) ?? { userIds: [], totalWatchlists: 0, totalAlerts: 0 };
  data.totalAlerts += delta;
  await s.write("global", data);
}
