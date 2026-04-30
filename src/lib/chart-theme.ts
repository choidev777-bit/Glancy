export function getChartTheme(theme: 'dark' | 'light') {
  const palette =
    theme === 'dark'
      ? {
          surface2: '#1a1a1a',
          textSecondary: '#a3a3a3',
          borderDefault: '#262626',
        }
      : {
          surface2: '#f5f5f5',
          textSecondary: '#525252',
          borderDefault: '#e5e5e5',
        };

  return {
    layout: {
      background: {
        color: palette.surface2,
      },
      textColor: palette.textSecondary,
      fontFamily: 'Pretendard, Inter, sans-serif',
    },
    grid: {
      vertLines: { color: palette.borderDefault },
      horzLines: { color: palette.borderDefault },
    },
    timeScale: {
      borderColor: palette.borderDefault,
      timeVisible: true,
    },
    rightPriceScale: {
      borderColor: palette.borderDefault,
    },
  };
}

export function getCandleColors(theme: 'dark' | 'light') {
  return theme === 'dark'
    ? { up: '#22c55e', down: '#ef4444', upWick: '#16a34a', downWick: '#dc2626' }
    : { up: '#16a34a', down: '#dc2626', upWick: '#15803d', downWick: '#b91c1c' };
}

export function getMAColors(theme: 'dark' | 'light'): string[] {
  return theme === 'dark'
    ? ['#06b6d4', '#a855f7', '#f59e0b', '#ec4899']
    : ['#0891b2', '#9333ea', '#d97706', '#db2777'];
}
