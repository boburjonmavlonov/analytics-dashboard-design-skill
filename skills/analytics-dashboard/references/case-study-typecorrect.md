# Case study: TypeCorrect's analytics

[TypeCorrect](https://typecorrect.com) is a small macOS menu bar app that fixes text typed in the wrong keyboard
layout. It is sold from its website: download a DMG, install, a 7-day free trial, then a one-time license
through a payment provider. Its owner wanted one page that answered "is it growing, where do people drop off,
and who actually pays?".

The dashboard runs as a Cloudflare Worker with a D1 (SQLite) database: the website and the app post events to
it, a cron and on-demand syncs pull orders from the payment provider, and one `/api/stats?days=N` endpoint returns
everything the page shows. The page is a single HTML file with no dependencies. The example in this repository
is that page, translated and fed with made-up data.

## What the owner asked for, in order

1. **"Show downloads, installs, trials, licenses and active users by country, and redesign the UI —
   minimalist, Cloudflare style."** → the sidebar and top-bar frame, the hairline KPI row, one chart with metric
   tabs, and the countries table with a window under every column.
2. **"Show the path of people who bought: where they came from, whether they used the trial, for how many days,
   whether they were active during it."** → buyer journeys: the KPI row, sources, timing donut, and expandable
   rows with a timeline. This needed the network-hash join in [privacy.md](privacy.md#joining-website-and-app),
   because the website and the app share no ID.
3. **"The dashboard says $35, but there was another sale and revenue is really $40."** → revenue freshness:
   sync on dashboard load (with a 4-second cap), on every license activation, and on a cron as a fallback;
   "payments synced …" in the header.
4. **"Don't count $0 orders as customers."** → `amount - refunded > 0` for sales and customers.

## Bugs the screenshots caught

| What the screenshot showed | Cause | Rule it became |
|---|---|---|
| The page scrolled sideways on a phone | grid columns of `1fr` grew with long numbers | always `minmax(0, 1fr)` ([layout.md](layout.md#grids)) |
| The header wrapped into three lines on a phone | status, period control and buttons in one row | hide the status under 640 px |
| Revenue $35 vs $40 at the provider | a scheduled sync that only ran hourly | sync on load and on sale ([metrics.md](metrics.md#revenue)) |
| One customer more than had paid | a 100%-off order | free orders aren't customers |
| A grey block after the fifth buyer tile (found while building this repo) | hairlines drawn by a grey grid gap | per-cell inset hairlines |
| "1 active days" (found while translating the page) | Uzbek has no plural after numbers; English does | a `plural()` helper |
| A test passed because an attribute had been added only for it | the test asserted on markup | removed the attribute; the test checks computed values |

## What stayed out

- **Goals and alerts.** With a few sales a day, a target line on a chart is noise. The KPI deltas with their
  baselines did the job.
- **Per-user drill-down beyond buyers.** Install IDs exist, but browsing individual non-paying users is not a
  question the owner needed answered, and it is the part of analytics that feels like surveillance.
- **A charting library.** SVG paths, CSS conic gradients and `Intl` covered everything, and the page stayed one
  file.
