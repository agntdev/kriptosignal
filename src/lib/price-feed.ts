const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export interface CoinPrice {
  id: string;
  ticker: string;
  name: string;
  price: number;
  change24h: number;
}

export interface CoinSearchResult {
  id: string;
  ticker: string;
  name: string;
}

export const POPULAR_COINS: CoinSearchResult[] = [
  { id: "bitcoin", ticker: "BTC", name: "Bitcoin" },
  { id: "ethereum", ticker: "ETH", name: "Ethereum" },
  { id: "solana", ticker: "SOL", name: "Solana" },
  { id: "cardano", ticker: "ADA", name: "Cardano" },
  { id: "dogecoin", ticker: "DOGE", name: "Dogecoin" },
  { id: "polkadot", ticker: "DOT", name: "Polkadot" },
  { id: "ripple", ticker: "XRP", name: "XRP" },
  { id: "avalanche-2", ticker: "AVAX", name: "Avalanche" },
];

export async function fetchPrices(coinIds: string[]): Promise<CoinPrice[]> {
  if (coinIds.length === 0) return [];

  const ids = coinIds.join(",");
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  const results: CoinPrice[] = [];

  for (const [id, priceData] of Object.entries(data)) {
    if (priceData.usd !== undefined) {
      const coin = POPULAR_COINS.find((c) => c.id === id);
      results.push({
        id,
        ticker: coin?.ticker ?? id.toUpperCase(),
        name: coin?.name ?? id,
        price: priceData.usd,
        change24h: priceData.usd_24h_change ?? 0,
      });
    }
  }

  return results;
}

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = (await response.json()) as { coins?: Array<{ id: string; symbol: string; name: string }> };
  return (data.coins ?? []).slice(0, 10).map((c) => ({
    id: c.id,
    ticker: c.symbol.toUpperCase(),
    name: c.name,
  }));
}
