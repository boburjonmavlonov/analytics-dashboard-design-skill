# Screenshot QA

Code review doesn't catch a grey hole in a KPI row or a "1 active days". Screenshots do. Run this pass before
calling any dashboard work done.

## 1. Known totals

Compute the key numbers outside the page (SQL, a script, the payment provider's dashboard) and compare:

- KPI tiles = sums of the daily series for the window.
- Each countries column sums to its tile (Active today = DAU, Active 30d = MAU).
- Funnel steps never increase within a group.
- Revenue matches the payment provider for the same window, net of refunds, excluding $0 orders.
- Buyer summary count = licenses activated in the window.
- "All time" customers × price ≈ all-time revenue (exactly, if there are no discounts).

In the example, `node examples/sample-data.mjs` builds every number from one series, so these hold by
construction; your app should have the same checks as tests.

## 2. Screenshot matrix

| Width | Theme | Period | Look for |
|---|---|---|---|
| 1440 | light | 30 days | first glance: does the overview answer "growing? where do people drop?" |
| 1440 | dark | 30 days | every colour is a token; nothing glows; the brand bar is visible |
| 1024 | light | 90 days | KPI rows at 3 columns, card grids at 2, weekly buckets labelled |
| 390 | light | 30 days | no sideways page scroll; section strip scrolls; tables scroll inside cards |
| 390 | dark | 7 days | small numbers: grey deltas, "new" instead of percentages |
| 1440 | light | 1 year | monthly buckets, axis ticks round, sparkline matches chart |

And the states: no data at all, an API error, a section with no rows.

Headless Chrome won't open a window narrower than about 500 px; render the page in a 390 px iframe and crop
(see `tools/phone-frame.html` and `tools/screenshots.sh`).

## 3. Smells

| Smell | Usually means | Fix |
|---|---|---|
| A grey block at the end of a KPI row | hairlines faked with `gap` on a grey background | per-cell inset hairlines ([snippets.md](snippets.md#hairline-kpi-row)) |
| The page scrolls sideways on a phone | `1fr` instead of `minmax(0, 1fr)`, or a table outside a scroll wrapper | `minmax(0, 1fr)` and `overflow-x: auto` wrappers |
| Header wraps into three lines on a phone | status, period and buttons all in one row | hide the status under 640 px; stretch the period control |
| "1 active days", "1 pages" | plurals copied from a language without them | a `plural()` helper |
| Revenue differs from the payment provider | scheduled sync lagging, $0 orders, refunds | sync on load and on sale; `amount - refunded > 0` |
| A big red `▼ 100%` | base of 1 or 2 | quiet grey on small bases; "new" from zero |
| Every delta is red after a launch | the previous window contains the launch spike | say "vs the previous 30 days"; check the spike before panicking |
| "Licensed 44%" but the slices don't cover everyone | non-reporting users dropped | a grey "Not reported" slice over the full population |
| "Active after buying 100%" | test or sample data too perfect | check the definition and the data, not the UI |
| A sparkline shaped differently from the chart | sparkline on a different window or bucket | same `chartBuckets()` for both |
| Axis ticks like 173, 346, 519 | max divided by four | `niceStep()` |
| Times in one table in UTC, another in local time | `toLocaleString()` without a time zone | pick one and say it in the header |
| A test passes only because of an attribute added for it | the test checks markup, not the result | test the computed numbers, not the DOM shape |

## 4. Accessibility spot checks

- Tab through the page: period buttons, theme, tabs, chart (← →), sortable headers, buyer rows (Enter).
- With a screen reader, the chart announces the metric, grouping and total, then each point.
- Zoom to 200 %: nothing overlaps; tables scroll.
