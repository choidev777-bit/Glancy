import { useEffect, useState } from 'react';
import type { Candle } from '../lib/api';

export function useBinanceWebSocket(symbol: string | null, interval = '1m'): Candle | null {
  const [latest, setLatest] = useState<Candle | null>(null);

  useEffect(() => {
    if (!symbol) {
      setLatest(null);
      return;
    }

    const streamSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamSymbol}@kline_${interval}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data));
        const kline = message.k;
        if (!kline) return;
        setLatest({
          time: Math.floor(Number(kline.t) / 1000),
          open: Number(kline.o),
          high: Number(kline.h),
          low: Number(kline.l),
          close: Number(kline.c),
          volume: Number(kline.v),
        });
      } catch {
        // Realtime ticks are best-effort; malformed messages should not break the chart.
      }
    };

    ws.onerror = () => {
      setLatest(null);
    };

    return () => {
      ws.close();
    };
  }, [interval, symbol]);

  return latest;
}
