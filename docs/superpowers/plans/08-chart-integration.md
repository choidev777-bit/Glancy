# Plan 08 — 차트 통합 (Lightweight Charts)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TradingView Lightweight Charts를 프론트엔드에 통합하여, 백엔드에서 받은 OHLCV / 지표 데이터를 캔들차트 + MA 오버레이 + RSI/MACD 보조 패널로 렌더링한다. 암호화폐 탭은 Binance WebSocket으로 실시간 갱신.

**Architecture:** `lightweight-charts` 패키지 사용. 차트는 React 훅(`useChart`)으로 wrap. 메인 차트(캔들+MA), RSI 보조, MACD 보조 3개 인스턴스를 별도 컴포넌트로 분리. WebSocket 연결은 카테고리가 암호화폐일 때만 활성화. 업로드/비정형 데이터의 자동 시각화는 Plan 14의 ChartSpec/VisualizationBundle 레이어가 담당하며, 본 Plan의 차트 컴포넌트를 재사용한다.

**Tech Stack:** lightweight-charts 4.x / React 18 / TypeScript / 백엔드 API 호출용 fetch

**예상 소요:** 6~8시간

---

## File Structure

```
src/
├── lib/
│   ├── api.ts                    # 백엔드 API 클라이언트
│   └── chart-theme.ts            # theme.md 토큰 → 차트 색상 매핑
├── hooks/
│   ├── useChart.ts               # Lightweight Charts 라이프사이클
│   ├── useIndicatorsData.ts      # 백엔드 indicators API 호출
│   └── useBinanceWebSocket.ts    # 암호화폐 실시간
├── components/
│   └── charts/
│       ├── CandleChart.tsx       # 메인 캔들 + MA 오버레이
│       ├── RSIChart.tsx          # RSI 보조 패널
│       ├── MACDChart.tsx         # MACD 보조 패널
│       └── ChartContainer.tsx    # 3개 차트 묶음 + 동기화
```

---

## Tasks

### Task 1: 라이브러리 설치 + API 클라이언트

**Files:**
- Modify: `package.json`
- Create: `src/lib/api.ts`

- [ ] **Step 1: 설치**

```powershell
cd "C:\Users\thisi\Documents\Glancy"
npm install lightweight-charts
```

- [ ] **Step 2: `.env.local` 생성**

```
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 3: `src/lib/api.ts` 작성**

```typescript
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicator {
  name: string;
  value: number;
  signal: string;
  score: number;
}

export interface MovingAverage {
  period: number;
  sma: number | null;
  ema: number | null;
  signal: string;
  score: number;
}

export interface IndicatorsResponse {
  indicators: Indicator[];
  moving_averages: MovingAverage[];
  ma_alignment: string;
  ma_cross: string;
  bollinger: { upper: number; middle: number; lower: number; signal: string };
  pivots: Record<string, Record<string, number>>;
  gauges: {
    moving_average: { percent: number; signal: string };
    technical: { percent: number; signal: string };
    overall: { percent: number; signal: string };
  };
  insights?: { summary: string; details: { category: string; text: string }[] };
}

export interface MarketData {
  source: string;
  symbol: string;
  name: string;
  type: string;
  currency: string;
  candles: Candle[];
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return r.json();
}

export const api = {
  krStock: (ticker: string, days = 365) => get<MarketData>(`/kr-stocks/${ticker}?days=${days}`),
  usStock: (symbol: string, period = "1y") => get<MarketData>(`/us-stocks/${symbol}?period=${period}`),
  etf: (symbol: string, period = "1y") => get<MarketData>(`/etfs/${symbol}?period=${period}`),
  crypto: (symbol: string, interval = "1d", limit = 365) =>
    get<MarketData>(`/crypto/${symbol}?interval=${interval}&limit=${limit}`),
  index: (symbol: string, period = "1y") =>
    get<MarketData>(`/indices/${encodeURIComponent(symbol)}?period=${period}`),
  topCoins: (limit = 20) => get<{ id: string; symbol: string; name: string; binance_symbol: string }[]>(`/crypto/top?limit=${limit}`),

  indicators: {
    kr: (ticker: string, days = 365) => get<IndicatorsResponse>(`/indicators/kr-stocks/${ticker}?days=${days}`),
    us: (symbol: string, period = "1y") => get<IndicatorsResponse>(`/indicators/us-stocks/${symbol}?period=${period}`),
    crypto: (symbol: string, interval = "1d", limit = 365) =>
      get<IndicatorsResponse>(`/indicators/crypto/${symbol}?interval=${interval}&limit=${limit}`),
  },

  fundamental: {
    kr: (ticker: string) => get(`/fundamental/kr/${ticker}`),
    us: (symbol: string) => get(`/fundamental/us/${symbol}`),
  },
};
```

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json src/lib/api.ts
git commit -m "feat(api): install lightweight-charts + add API client"
```

---

### Task 2: 차트 테마 매핑

**Files:**
- Create: `src/lib/chart-theme.ts`

- [ ] **Step 1: `chart-theme.ts` 작성**

```typescript
export function getChartTheme(theme: "dark" | "light") {
  const root = getComputedStyle(document.documentElement);

  return {
    layout: {
      background: { color: root.getPropertyValue("--surface-2").trim() || (theme === "dark" ? "#1a1a1a" : "#f5f5f5") },
      textColor: root.getPropertyValue("--text-secondary").trim() || (theme === "dark" ? "#a3a3a3" : "#525252"),
      fontFamily: "Pretendard, Inter, sans-serif",
    },
    grid: {
      vertLines: { color: root.getPropertyValue("--border-default").trim() || "#262626" },
      horzLines: { color: root.getPropertyValue("--border-default").trim() || "#262626" },
    },
    crosshair: {
      mode: 1,
    },
    timeScale: {
      borderColor: root.getPropertyValue("--border-default").trim(),
      timeVisible: true,
    },
    rightPriceScale: {
      borderColor: root.getPropertyValue("--border-default").trim(),
    },
  };
}

export function getCandleColors(theme: "dark" | "light") {
  return theme === "dark"
    ? { up: "#22c55e", down: "#ef4444", upWick: "#16a34a", downWick: "#dc2626" }
    : { up: "#16a34a", down: "#dc2626", upWick: "#15803d", downWick: "#b91c1c" };
}

export function getMAColors(theme: "dark" | "light"): string[] {
  return theme === "dark"
    ? ["#06b6d4", "#a855f7", "#f59e0b", "#ec4899"]
    : ["#0891b2", "#9333ea", "#d97706", "#db2777"];
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/chart-theme.ts
git commit -m "feat(chart): theme tokens to chart colors mapper"
```

---

### Task 3: 메인 캔들차트 + MA 오버레이

**Files:**
- Create: `src/components/charts/CandleChart.tsx`

- [ ] **Step 1: `CandleChart.tsx` 작성**

```tsx
import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, Time } from "lightweight-charts";
import type { Candle, MovingAverage } from "../../lib/api";
import { getCandleColors, getChartTheme, getMAColors } from "../../lib/chart-theme";

interface Props {
  candles: Candle[];
  movingAverages?: MovingAverage[];
  enabledMAs?: number[];
  theme: "dark" | "light";
  height?: number;
}

export default function CandleChart({ candles, movingAverages = [], enabledMAs = [5, 20, 60], theme, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const maSeriesRef = useRef<Map<number, ISeriesApi<"Line">>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    const colors = getCandleColors(theme);
    const candleSeries = chart.addCandlestickSeries({
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.upWick,
      wickDownColor: colors.downWick,
    });
    candleSeriesRef.current = candleSeries;

    const onResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      maSeriesRef.current.clear();
    };
  }, [theme, height]);

  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    const colors = getMAColors(theme);

    // 기존 MA 시리즈 제거
    maSeriesRef.current.forEach((s) => chartRef.current?.removeSeries(s));
    maSeriesRef.current.clear();

    enabledMAs.forEach((period, idx) => {
      const ma = movingAverages.find((m) => m.period === period);
      if (!ma || ma.sma === null) return;

      // 간이 SMA 라인 생성: 백엔드는 마지막 값만 주므로, 프론트에서 캔들로 다시 계산
      const lineData: LineData<Time>[] = [];
      const closes = candles.map((c) => c.close);
      for (let i = period - 1; i < closes.length; i++) {
        const slice = closes.slice(i - period + 1, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / period;
        lineData.push({ time: candles[i].time as Time, value: avg });
      }

      const series = chartRef.current!.addLineSeries({
        color: colors[idx % colors.length],
        lineWidth: 1,
        title: `MA${period}`,
      });
      series.setData(lineData);
      maSeriesRef.current.set(period, series);
    });
  }, [candles, movingAverages, enabledMAs, theme]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/charts/CandleChart.tsx
git commit -m "feat(chart): candle chart with MA overlay"
```

---

### Task 4: RSI + MACD 보조 패널

**Files:**
- Create: `src/components/charts/RSIChart.tsx`
- Create: `src/components/charts/MACDChart.tsx`

- [ ] **Step 1: `RSIChart.tsx` 작성**

```tsx
import { useEffect, useRef } from "react";
import { createChart, IChartApi, LineData, Time } from "lightweight-charts";
import type { Candle } from "../../lib/api";
import { getChartTheme } from "../../lib/chart-theme";

interface Props {
  candles: Candle[];
  period?: number;
  theme: "dark" | "light";
  height?: number;
}

function calcRSI(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (i <= period) {
      if (diff > 0) gainSum += diff;
      else lossSum -= diff;
      out.push(null);
      if (i === period) {
        const rs = gainSum / period / (lossSum / period || 1);
        out[period - 1] = 100 - 100 / (1 + rs);
      }
    } else {
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      gainSum = (gainSum * (period - 1) + gain) / period;
      lossSum = (lossSum * (period - 1) + loss) / period;
      const rs = gainSum / (lossSum || 1);
      out.push(100 - 100 / (1 + rs));
    }
  }
  return [null, ...out];
}

export default function RSIChart({ candles, period = 14, theme, height = 180 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
    });

    const closes = candles.map((c) => c.close);
    const rsiValues = calcRSI(closes, period);

    const series = chart.addLineSeries({ color: "#06b6d4", lineWidth: 2, title: `RSI(${period})` });
    const data: LineData<Time>[] = [];
    rsiValues.forEach((v, i) => {
      if (v !== null) data.push({ time: candles[i].time as Time, value: v });
    });
    series.setData(data);

    // 과매수/과매도 임계선
    const overbought = chart.addLineSeries({ color: "#ef4444", lineWidth: 1, lineStyle: 2 });
    overbought.setData(candles.map((c) => ({ time: c.time as Time, value: 70 })));

    const oversold = chart.addLineSeries({ color: "#22c55e", lineWidth: 1, lineStyle: 2 });
    oversold.setData(candles.map((c) => ({ time: c.time as Time, value: 30 })));

    chart.timeScale().fitContent();

    const onResize = () => containerRef.current && chart.applyOptions({ width: containerRef.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [candles, period, theme, height]);

  return (
    <div>
      <div className="text-xs font-bold text-text-secondary mb-1">RSI({period})</div>
      <div ref={containerRef} style={{ width: "100%", height }} />
    </div>
  );
}
```

- [ ] **Step 2: `MACDChart.tsx` 작성**

```tsx
import { useEffect, useRef } from "react";
import { createChart, HistogramData, LineData, Time } from "lightweight-charts";
import type { Candle } from "../../lib/api";
import { getChartTheme } from "../../lib/chart-theme";

interface Props {
  candles: Candle[];
  fast?: number;
  slow?: number;
  signal?: number;
  theme: "dark" | "light";
  height?: number;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => {
    if (i === 0) out.push(v);
    else out.push(v * k + out[i - 1] * (1 - k));
  });
  return out;
}

export default function MACDChart({ candles, fast = 12, slow = 26, signal = 9, theme, height = 180 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
    });

    const closes = candles.map((c) => c.close);
    const fastEma = ema(closes, fast);
    const slowEma = ema(closes, slow);
    const macdLine = fastEma.map((v, i) => v - slowEma[i]);
    const signalLine = ema(macdLine, signal);
    const histogram = macdLine.map((v, i) => v - signalLine[i]);

    const macdSeries = chart.addLineSeries({ color: "#06b6d4", lineWidth: 2, title: "MACD" });
    macdSeries.setData(macdLine.map((v, i) => ({ time: candles[i].time as Time, value: v })) as LineData<Time>[]);

    const sigSeries = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1, title: "Signal" });
    sigSeries.setData(signalLine.map((v, i) => ({ time: candles[i].time as Time, value: v })) as LineData<Time>[]);

    const histSeries = chart.addHistogramSeries({ priceFormat: { type: "price", precision: 2, minMove: 0.01 } });
    histSeries.setData(
      histogram.map((v, i) => ({
        time: candles[i].time as Time,
        value: v,
        color: v >= 0 ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
      })) as HistogramData<Time>[]
    );

    chart.timeScale().fitContent();
    const onResize = () => containerRef.current && chart.applyOptions({ width: containerRef.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [candles, fast, slow, signal, theme, height]);

  return (
    <div>
      <div className="text-xs font-bold text-text-secondary mb-1">MACD({fast},{slow},{signal})</div>
      <div ref={containerRef} style={{ width: "100%", height }} />
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/charts/
git commit -m "feat(chart): RSI + MACD sub panels"
```

---

### Task 5: ChartContainer + TechnicalView 통합

**Files:**
- Create: `src/components/charts/ChartContainer.tsx`
- Modify: `src/components/analysis/TechnicalView.tsx`

- [ ] **Step 1: `ChartContainer.tsx` 작성**

```tsx
import CandleChart from "./CandleChart";
import RSIChart from "./RSIChart";
import MACDChart from "./MACDChart";
import type { Candle, MovingAverage } from "../../lib/api";

interface Props {
  candles: Candle[];
  movingAverages?: MovingAverage[];
  enabledMAs?: number[];
  theme: "dark" | "light";
}

export default function ChartContainer({ candles, movingAverages, enabledMAs, theme }: Props) {
  if (candles.length === 0) {
    return <div className="card p-8 text-text-secondary text-center">차트 데이터를 불러오는 중...</div>;
  }
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <CandleChart candles={candles} movingAverages={movingAverages} enabledMAs={enabledMAs} theme={theme} height={400} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <RSIChart candles={candles} theme={theme} height={180} />
        </div>
        <div className="card p-4">
          <MACDChart candles={candles} theme={theme} height={180} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `TechnicalView.tsx`에서 placeholder를 ChartContainer로 교체**

기존 "Main Chart Placeholder" + "RSI 보조 차트 영역" 부분을 ChartContainer로 대체.

```tsx
// TechnicalView.tsx 상단
import ChartContainer from "../charts/ChartContainer";
// props로 candles, movingAverages, theme, enabledMAs 받도록 수정
// 또는 hook으로 fetch (Task 6에서 처리)
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/charts/ChartContainer.tsx src/components/analysis/TechnicalView.tsx
git commit -m "feat(chart): ChartContainer + TechnicalView integration"
```

---

### Task 6: useIndicatorsData 훅 + App.tsx 와이어링

**Files:**
- Create: `src/hooks/useIndicatorsData.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 훅 작성**

```tsx
import { useEffect, useState } from "react";
import { api, IndicatorsResponse, MarketData } from "../lib/api";

export function useMarketData(category: string, symbol: string) {
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetcher = (() => {
      switch (category) {
        case "한국주식": return api.krStock(symbol);
        case "미국주식": return api.usStock(symbol);
        case "ETF": return api.etf(symbol);
        case "암호화폐": return api.crypto(symbol);
        case "글로벌지수": return api.index(symbol);
        default: return Promise.reject(new Error("미지원 카테고리"));
      }
    })();

    fetcher
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [category, symbol]);

  return { data, error, loading };
}

export function useIndicators(category: string, symbol: string) {
  const [data, setData] = useState<IndicatorsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetcher = (() => {
      if (category === "한국주식") return api.indicators.kr(symbol);
      if (category === "미국주식" || category === "ETF" || category === "글로벌지수") return api.indicators.us(symbol);
      if (category === "암호화폐") return api.indicators.crypto(symbol);
      return Promise.reject(new Error("미지원 카테고리"));
    })();

    fetcher
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [category, symbol]);

  return { data, error, loading };
}
```

- [ ] **Step 2: App.tsx에서 hook 사용 + 자식에 props로 전달**

기존 mockData 의존성을 위 훅으로 교체. 카테고리별 기본 종목 매핑.

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useIndicatorsData.ts src/App.tsx
git commit -m "feat(chart): wire useIndicatorsData hook + App integration"
```

---

### Task 7: Binance WebSocket 실시간 (암호화폐 한정)

**Files:**
- Create: `src/hooks/useBinanceWebSocket.ts`
- Modify: `src/components/charts/CandleChart.tsx` (실시간 업데이트 prop 추가)

- [ ] **Step 1: `useBinanceWebSocket.ts` 작성**

```tsx
import { useEffect, useState } from "react";
import type { Candle } from "../lib/api";

export function useBinanceWebSocket(symbol: string | null, interval = "1m") {
  const [latest, setLatest] = useState<Candle | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const lower = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${lower}@kline_${interval}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const k = msg.k;
        if (!k) return;
        setLatest({
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        });
      } catch {
        /* ignore */
      }
    };

    return () => ws.close();
  }, [symbol, interval]);

  return latest;
}
```

- [ ] **Step 2: CandleChart에서 latestCandle prop 받아서 update()**

```tsx
// 기존 candleSeriesRef에 update 추가
useEffect(() => {
  if (!candleSeriesRef.current || !latestCandle) return;
  candleSeriesRef.current.update({
    time: latestCandle.time as Time,
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    close: latestCandle.close,
  });
}, [latestCandle]);
```

- [ ] **Step 3: ChartContainer가 카테고리=암호화폐일 때 훅 활성화**

```tsx
const realtimeCandle = useBinanceWebSocket(category === "암호화폐" ? symbol : null);
// CandleChart에 prop으로 전달
```

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/useBinanceWebSocket.ts src/components/charts/
git commit -m "feat(chart): Binance WebSocket real-time updates for crypto"
```

---

## Self-Review

- [ ] 메인 캔들차트 + MA 오버레이 작동?
- [ ] RSI + MACD 보조 패널 작동?
- [ ] 차트 색상이 theme.md 토큰 기반? (다크/라이트 전환 시 자동 변경)
- [ ] 암호화폐 탭에서 WebSocket 실시간?
- [ ] 카테고리 전환 시 차트 정상 재로드?
- [ ] 윈도우 리사이즈 시 차트 폭 자동 조정?
- [ ] Plan 14의 ChartSpec 기반 자동 시각화 컴포넌트와 재사용 가능한가?

## 완료 조건

`npm run dev` 후 카테고리 탭마다 클릭 시 캔들차트 + RSI + MACD가 정상 렌더링되며, 암호화폐 탭에서 실시간 업데이트가 보임.
