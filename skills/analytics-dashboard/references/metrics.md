# Honest numbers

A dashboard loses its owner's trust the first time two numbers disagree. Most disagreements are not bugs in the
arithmetic; they are undefined windows, mixed units and guesses shown as facts. This file is the checklist.

## The data contract

Write one line per number before building UI. Keep it next to the API, not in the page.

| Number | Counts | Window | Unique? | Compared with |
|---|---|---|---|---|
| Visitors | `pageview` events | selected period, UTC days | unique per day, summed | previous period of the same length |
| Downloads | `download` events | selected period | unique per day, summed | previous period |
| New installs | first `install` per install ID | selected period | unique install IDs | previous period |
| Trials started | first successful action per install | selected period | unique install IDs | previous period |
| Licenses activated | `license_activated` | selected period | unique install IDs | previous period |
| Revenue | paid orders minus refunds, from the payment provider | selected period, order time | — | previous period |
| Active today | install IDs with an `active` event today | today, UTC | unique | — |
| Active 30d (MAU) | install IDs active in the last 30 days | rolling 30 days | unique | — |

Rules that come out of writing it:

- **Two places, one field.** If revenue appears in a KPI tile, a chart and a funnel, all three read
  `current.revenue`. Never recompute a number in the browser that the server already computed.
- **Each column keeps its own window.** In a countries table, "Downloads" counts the period, "Active today"
  counts today. Put the window under the column header ("period", "today", "30 days"), not only in a footnote.
- **UTC, said once.** Days are UTC days; the header range says "(UTC)". Times in tables and timelines are also
  UTC, or all local — never a mix.
- **The previous period** has the same length and ends the day before the current one starts. The header says
  "vs the previous 30 days".

## Uniques

Daily uniques can't be summed into period uniques. If visitors are counted cookie-free (a daily salted hash),
there is no way to know that Monday's and Tuesday's visitor were the same person. So:

- Label the period total as what it is: "Visitors — sum of daily uniques".
- When the chart groups days into weeks or months, say so in the chart context line: "weekly total (sum of daily
  uniques)".
- Active users are different: install IDs are stable, so DAU, WAU and MAU are true uniques over their window.
  When DAU is grouped into weeks, show the **average** per day, not the sum, and say "daily average".

## Deltas

| Previous → current | Show | Why |
|---|---|---|
| 0 → 0 | `0%` grey | nothing happened |
| 0 → 3 | `new` | a percentage of zero is meaningless |
| 1 → 2 (both tiny) | `▲ 100%` grey, with "was 1" | technically true, but colouring it green shouts about noise |
| 15.4K → 16.3K | `▲ 5.6%` green, "was 15.4K" | the normal case |
| 47 → 55 | `▲ 17%` green, "was 47" | the baseline makes the size of the change readable |

Always show the baseline ("was 47") beside the percentage. A percentage alone hides whether it was 2 → 3 or
2,000 → 3,000.

Green means "better". For metrics where up is bad (errors, refunds, churn), invert the colour, not the arrow.

## Revenue

Revenue is the number the owner checks first and trusts least. Three rules:

1. **Net, from the source of truth.** Use the payment provider's orders: amount minus refunded amount. Don't
   multiply sales by list price; discounts, taxes and refunds make that wrong.
2. **Free orders are not customers.** A 100%-off code creates a $0 order. Count customers and sales only where
   `amount - refunded > 0`, or "8 paying customers" becomes 9.
3. **Freshness is part of the number.** If revenue is synced from the provider on a schedule, the dashboard will
   show $35 while the provider shows $40. Sync when the dashboard loads (with a short timeout so the page never
   hangs), when a license is activated, and on a frequent cron as a fallback. Show "payments synced 08:57 UTC" in
   the header so a stale number explains itself.

## Funnels

A funnel mixes two kinds of counts, and the page must say which is which.

- **Website steps** (visits → downloads) are event counts in the period. Conversion is step over previous step:
  "12% of visits".
- **App steps** (installs → permissions → trial → trial ended → paid) are a **cohort**: Macs installed in this
  period, and how far each has got by now. Conversion is over the cohort's first step: "83% of installs".

Label the group: "App · Macs installed in this period". Without it, someone will divide this month's sales by
this month's installs and wonder why recent cohorts look worse (they haven't had time to finish the trial).

Bars are sized against the group's first step, so each group reads as its own funnel. The first row of each
group shows "was N" instead of a conversion.

## Attribution

The website and the app usually share no identifier. A source for a buyer is therefore an inference, and the UI
must show how sure it is.

- **Exact match:** an install is linked to a download from the same network (daily salted hash of the IP, see
  [privacy.md](privacy.md)) in the two days before it.
- **Approximate:** no network match, but exactly one download from the same country in the two hours (or two
  days) before. Show it with an `approx.` tag and "approximate match" in the timeline.
- **Unknown:** several candidates, or none. Show "Unknown" as a source row with its count. Never pick one
  candidate at random to fill the gap.

Source is the first referrer or `utm_source` seen that day. `utm_source` wins over the referrer when both exist,
and is shown as `utm: newsletter` so it doesn't merge with a domain.

## Shares and donuts

- A donut over "Macs active in the last 30 days" must include the Macs that didn't report the attribute. Compute
  `population − sum(reported)` and draw it as a grey **Not reported** slice. Otherwise "Licensed 44%" is a share
  of the reporting Macs, not of the users.
- Say under each donut what the share is of: "Share of Macs active in the last 30 days" or "Share within the
  groups shown".
- Bar lists show the count and the share of the list total, with the bar sized against the largest row.

## Medians, not means

Time-to-purchase, active days in trial and paywall-to-purchase are skewed: one buyer who installed a year ago
and bought today drags a mean to "47 days". Show the median and label it "median".

## Cohorts

A retention heatmap row is a weekly install cohort; cell *k* is the share of that cohort active in week *k*.
Cells for weeks that haven't happened yet are a muted dot with the tooltip "This week hasn't happened yet" —
never 0%.

## Known totals

The QA pass ([qa.md](qa.md)) checks numbers computed outside the page against the screen. In the example,
`examples/sample-data.mjs` builds every number from one daily series, and the page only formats them:

- the KPI tiles equal the sums of the daily series;
- every countries column sums to its tile (or to DAU / MAU);
- funnel steps never increase down a group;
- buyer summary counts all buyers, even though the table lists the newest 50 (the note says so).
