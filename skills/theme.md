# theme.md - Design Token Layer

## 방향

Glancy는 dark financial workstation 스타일의 전문 투자 대시보드다. 시각적 장식보다 데이터 밀도, 숫자 가독성, 빠른 비교, 반복 사용성을 우선한다.

## 타이포그래피

| 용도 | 글꼴 |
| --- | --- |
| 본문과 UI | Pretendard, Inter, sans-serif |
| 숫자 | JetBrains Mono, SF Mono, Consolas, monospace |

숫자는 tabular figure처럼 자릿수가 안정적으로 보이게 한다.

## Dark Theme

```yaml
page_background: "#0a0a0a"
surface_1: "#121212"
surface_2: "#1a1a1a"
surface_3: "#222222"
surface_4: "#2a2a2a"
text_primary: "#fafafa"
text_secondary: "#a3a3a3"
text_tertiary: "#737373"
brand_primary: "#06b6d4"
positive: "#22c55e"
negative: "#ef4444"
neutral: "#a3a3a3"
warning: "#f59e0b"
info: "#3b82f6"
border_default: "#262626"
```

## Light Theme

```yaml
page_background: "#fafafa"
surface_1: "#ffffff"
surface_2: "#f5f5f5"
surface_3: "#e5e5e5"
surface_4: "#d4d4d4"
text_primary: "#0a0a0a"
text_secondary: "#525252"
text_tertiary: "#737373"
brand_primary: "#0891b2"
positive: "#16a34a"
negative: "#dc2626"
neutral: "#737373"
warning: "#d97706"
info: "#2563eb"
border_default: "#e5e5e5"
```

## 자산 색상

```yaml
chart_1: "#06b6d4"
chart_2: "#22c55e"
chart_3: "#f59e0b"
chart_4: "#ef4444"
chart_5: "#a855f7"
chart_6: "#14b8a6"
chart_7: "#8b5cf6"
chart_8: "#ec4899"
```

- 자산 식별 색상은 포트폴리오 donut, legend, 비교 차트에서 일치해야 한다.
- positive와 negative는 방향성에만 사용한다.
- 단일 하늘색 bar로 여러 자산의 비중을 표현하지 않는다.

## 컴포넌트 규칙

- 카드 radius는 8px 이하를 기본으로 한다.
- pill과 segmented control은 9999px radius를 허용한다.
- 카드 padding은 16px에서 24px 사이로 유지한다.
- 화면 전체가 한 가지 색상 계열로만 보이지 않게 한다.
- 버튼은 가능한 경우 아이콘이나 명확한 라벨을 사용한다.

## 접근성

- 색상만으로 신호를 전달하지 않는다.
- 수익률, 낙폭, 월별 수익률에는 숫자 라벨을 제공한다.
- 작은 카드 내부의 heading은 hero 크기로 키우지 않는다.
