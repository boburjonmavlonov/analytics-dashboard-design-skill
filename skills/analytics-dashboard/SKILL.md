---
name: analytics-dashboard
description: Build, redesign or critique a product analytics dashboard in a calm, Cloudflare-style layout — KPI row with deltas and sparklines, metric tabs over one chart, a sortable countries table, a website-to-app-to-paid funnel, buyer journeys, retention cohorts, app health, traffic sources and an event log — with honest numbers, privacy-first tracking and a screenshot QA pass. Use for a stats page, an indie app or SaaS analytics dashboard, a "how is my product doing" page, an admin metrics screen, or when asked why a dashboard's numbers don't add up.
---

# Analytics dashboard

A dashboard for one product answers one question at first glance: **is it growing, and where are people
dropping off?** Everything on the page exists to answer that, then to let the owner dig into why.

This skill was distilled from building and running the analytics dashboard of a shipped Mac app (website →
download → install → trial → paid), and from every bug its owner caught on a screenshot. The working example
is [`examples/product-analytics.html`](../../examples/product-analytics.html) with fixed sample data.

## How to work

Follow the steps in order. Each ends on a **done when** you can check.

### 1. Write the data contract first

Before any UI, list every number the page will show and, for each: the event it counts, the counting window,
unique or total, the time zone, and what "previous period" it is compared with. Put it in the API response
shape, not in the UI code. See [references/metrics.md](references/metrics.md).

**Done when** every tile, column and chart has one line in the contract, and two places that show "the same"
number read it from the same field.

### 2. Lay out the page

Sidebar with section links, a sticky top bar with freshness status and the period switch, then sections in
journey order: overview → countries → funnel → buyers → app → retention → website → events. One content column,
max 1280 px. See [references/layout.md](references/layout.md).

**Done when** the overview answers the first-glance question without scrolling at 1440 × 900.

### 3. Build the components from the reference

Use the patterns in [references/components.md](references/components.md) and the code in
[references/snippets.md](references/snippets.md): hairline KPI row, deltas with a "was" baseline, sparklines on
the chart's window, underline metric tabs over a single chart with a table toggle, sortable country table with a
share bar in the sorted column, funnel bars with step conversion, expandable buyer rows with a timeline, donuts
with an explicit "not reported" slice, retention heatmap with classed tiers.

Colours come only from the tokens in [references/tokens.md](references/tokens.md); light and dark are both
required.

**Done when** no component invents a colour, radius or font size outside the tokens.

### 4. Honesty pass

Go through [references/metrics.md](references/metrics.md) section by section. The usual offenders: a "−100%" on a
base of 1, revenue that lags the payment provider, $0 orders counted as customers, sums of daily uniques
labelled as uniques, donut shares that silently drop the people who didn't report, a "source" that is a guess
shown as a fact.

**Done when** every number states its window and every estimate says it is one.

### 5. Privacy pass

Analytics for a product people trust must not become the thing they distrust. Follow
[references/privacy.md](references/privacy.md): no cookies on the website, no stored IPs, no user content in
events, per-install random IDs, an opt-out in the app, and journeys joined by a daily salted hash, never by
identity.

**Done when** you can paste the event schema into the product's privacy policy without editing it.

### 6. Screenshot QA

Run [references/qa.md](references/qa.md): real screenshots at 1440, 1024 and 390 px, light and dark, every
period, with the totals checked against numbers computed outside the page. Look at the pictures, not the code.

**Done when** all screenshots are clean and the known totals match.

## Rules that apply everywhere

- **Journey order.** Sections follow the path a customer takes, so a drop-off reads top to bottom.
- **One window per number, stated.** "period", "today", "last 30 days" sits under the column or in the tile hint.
- **Compare like with like.** The previous period has the same length and ends where the current one starts.
- **No shouting on tiny bases.** 0 → 3 is "new", not "+∞%"; a delta on 1 → 2 is shown but quiet.
- **Unknown is a row, not a hole.** Unknown countries, unreported permissions and unmatched sources are shown,
  sorted last, and counted in totals.
- **Freshness is visible.** "Updated 09:00 UTC" and "payments synced 08:57" in the header; a red dot and a
  plain-language error when loading fails.
- **The table is always one click away.** Every chart has the exact daily values behind a "Table" toggle.
- **Keyboard and screen readers.** Charts take focus and step through points with ← →; sortable headers are
  buttons with `aria-sort`; expandable rows are `role="button"` with `aria-expanded`.
- **No dependencies.** SVG, CSS conic gradients and `Intl` cover every chart here; the example is one HTML file.

## House style

Neutral greys, one blue series colour, green and red only for good and bad, orange only for the brand mark.
13.5 px base text, 24 px KPI values, 600 weight for numbers and headings, tabular figures everywhere a number
can change. Hairlines, not shadows. 8 px card radius, 6 px controls, 4 px bars. See
[references/tokens.md](references/tokens.md).

## Critique format

When asked to review a dashboard (code, a URL or a screenshot), answer in this order:

1. **Verdict** in one sentence: does it answer the first-glance question?
2. **Numbers that disagree** — the same metric showing two values, totals that don't add up, windows that don't
   match. These come first because they destroy trust.
3. **Honesty issues** from [references/metrics.md](references/metrics.md).
4. **Privacy issues** from [references/privacy.md](references/privacy.md).
5. **Layout and component issues**, ranked by how much they slow the owner down.
6. **What works** — keep it short, but say it, so a redesign doesn't lose it.

Each issue: what you saw, why it misleads or slows, the fix.

## References

| File | What it covers |
|---|---|
| [metrics.md](references/metrics.md) | data contract, counting windows, deltas, revenue, attribution, funnels, cohorts |
| [layout.md](references/layout.md) | sidebar, top bar, section order, grids, breakpoints, phone layout |
| [components.md](references/components.md) | every component on the page, its states and its accessibility |
| [tokens.md](references/tokens.md) | light and dark colour tokens, type and spacing scale |
| [snippets.md](references/snippets.md) | delta, nice axis ticks, buckets, sparkline, donut, bar list, heatmap tiers, plural |
| [privacy.md](references/privacy.md) | cookieless visits, hashed networks, install IDs, opt-out, what never to collect |
| [qa.md](references/qa.md) | screenshot protocol, known totals, smell table |
| [case-study-typecorrect.md](references/case-study-typecorrect.md) | the real dashboard this came from, and the bugs each rule fixed |
