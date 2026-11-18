# Tokens

Every colour on the page is one of these. Light is the default; dark follows the system unless the theme button
forces one with `data-theme` on `<html>`.

```css
:root {
  color-scheme: light;
  /* surfaces */
  --bg: #fafafa; --side: #ffffff; --card: #ffffff; --line: #e5e5e5; --grid: #f0f0f0; --hover: #f5f5f5;
  /* text */
  --ink: #1f1f1f; --ink-2: #595959; --ink-3: #8c8c8c;
  /* accents: brand only for the logo and the current-section bar */
  --brand: #f6821f; --link: #0051c3;
  /* one series colour, its wash and the empty track of bars */
  --series: #2a78d6; --series-wash: rgba(42, 120, 214, .12); --track: #edf3fb;
  /* categories, in this order, for donuts with more than one non-semantic slice */
  --cat-2: #eb6834; --cat-3: #1baf7a; --cat-4: #eda100; --cat-5: #e87ba4;
  /* meaning */
  --good: #0ca30c; --good-wash: rgba(12, 163, 12, .10);
  --bad: #d03b3b;  --bad-wash: rgba(208, 59, 59, .09);
  --warn: #c98500;
  /* sequential scale for heatmaps, 0 = empty */
  --seq-0: #f4f7fb; --seq-1: #cde2fb; --seq-2: #9ec5f4; --seq-3: #6da7ec;
  --seq-4: #3987e5; --seq-5: #256abf; --seq-6: #184f95; --heat-ink: #ffffff;
}

/* Dark: the same names. Repeat this block under :root[data-theme="dark"] for the manual switch. */
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
    --bg: #121212; --side: #171717; --card: #1b1b1b; --line: #2e2e2e; --grid: #262626; --hover: #232323;
    --ink: #ededed; --ink-2: #b0b0b0; --ink-3: #808080;
    --link: #66a3ff;
    --series: #3987e5; --series-wash: rgba(57, 135, 229, .16); --track: #1e2a3a;
    --cat-2: #d95926; --cat-3: #199e70; --cat-4: #c98500; --cat-5: #d55181;
    --good: #3fbf6a; --good-wash: rgba(63, 191, 106, .12);
    --bad: #e66767;  --bad-wash: rgba(230, 103, 103, .12);
    --warn: #e0a000;
    --seq-0: #1f2329; --seq-1: #104281; --seq-2: #184f95; --seq-3: #1c5cab;
    --seq-4: #2a78d6; --seq-5: #5598e7; --seq-6: #86b6ef; --heat-ink: #0b0b0b;
  }
}
```

## How to use them

- **One series colour.** Bars, lines, sparklines, funnel bars, share bars and bar lists are all `--series` on
  `--track`. Comparing two metrics on one chart is rarely needed; the tabs switch metrics instead.
- **Green and red mean better and worse**, and nothing else. A licensed slice is green and an ended trial red
  because those are good and bad outcomes, not because they're "categories".
- **Amber (`--warn`) means "needs attention soon"**: the last trial days, a paywall shown, an `approx.` match,
  buying after the trial ended.
- **Grey (`--ink-3`) means unknown or not reported.** It is always the last slice and the last row.
- **Washes** (`--good-wash`, `--bad-wash`, `--series-wash`) are for pill backgrounds and fills, never for text.
- **The brand colour** appears twice: the logo tile and the current-section bar. Not in charts.
- **Heatmaps** use the sequential scale in classed tiers (see [snippets.md](snippets.md#heatmap-tiers)), with
  `--heat-ink` on the dark tiers. In dark mode the scale runs the other way round in lightness, so the strongest
  tier is the brightest.

## Type

| Use | Size | Weight |
|---|---|---|
| Body, tables | 13.5 px (13 px in tables) | 400 |
| Labels, meta, notes | 12–12.5 px | 400–500 |
| Column windows, tags | 10.5–11.5 px | 500–600 |
| Card titles | 13.5 px | 600 |
| Section titles (`h2`) | 16 px, −0.01 em | 600 |
| Page title (`h1`) | 22 px, −0.02 em | 600 |
| KPI values | 24 px (21 px on phones), −0.02 em | 600 |
| Funnel counts | 16 px | 600 |

System font stack: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`, with
`font-variant-numeric: tabular-nums` on every number.

## Shape and space

| Token | Value |
|---|---|
| Card radius | 8 px |
| Control radius (buttons, segmented, tabs) | 6 px outer, 4 px inner |
| Bar radius | 4 px (3 px on 6 px bar lists, 2 px on 4 px share bars) |
| Card padding | 16–18 px; card head 12 × 18 px |
| Gaps | 16 px between cards, 40 px between sections |
| Hairline | 1 px `--line` for borders, 1 px `--grid` between table rows and for gridlines |
| Icons | 16 px, 1.7 px stroke, round caps and joins |

No drop shadows on cards; only the tooltip has one.
