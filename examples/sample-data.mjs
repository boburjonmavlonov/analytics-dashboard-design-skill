// Generates examples/sample-data.js: fixed, made-up analytics for "Lumen", a fictional Mac app
// sold on its website. Run with `node examples/sample-data.mjs`.
//
// Every number the dashboard shows is computed here, outside the page, from one daily series,
// so totals, deltas, funnel steps, country rows and buyer summaries agree with each other.
// The page only formats what it is given. Same seed, same file.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const END = "2026-11-17";          // last full day (UTC)
const DAYS = 730;                  // 365 shown + 365 to compare against
const PRICE = 1200;                // $12.00, in cents
const PERIODS = [7, 30, 90, 365];

// Deterministic PRNG (mulberry32).
let seed = 20261117;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = (amount) => 1 + (rand() * 2 - 1) * amount;
const poisson = (mean) => {          // small counts stay integer and lumpy, like real sales
  if (mean > 40) return Math.max(0, Math.round(mean * noise(0.12)));
  let k = 0, p = 1; const l = Math.exp(-mean);
  do { k++; p *= rand(); } while (p > l);
  return k - 1;
};

const dayMs = 864e5;
const endTs = Date.parse(END + "T00:00:00Z");
const iso = (ts) => new Date(ts).toISOString().slice(0, 10);

// ------------------------------------------------------------------ daily series
const daily = [];
for (let i = 0; i < DAYS; i++) {
  const ts = endTs - (DAYS - 1 - i) * dayMs;
  const t = i / DAYS;
  const weekday = new Date(ts).getUTCDay();
  const week = weekday === 0 || weekday === 6 ? 0.72 : 1;
  const launch = i > DAYS - 130 && i < DAYS - 122 ? 2.6 : 1;   // a Product Hunt week, four months ago
  const visitors = Math.round((90 + 520 * t * t) * week * launch * noise(0.18));
  const downloads = Math.round(visitors * 0.115 * noise(0.2));
  const installs = Math.round(downloads * 0.72 * noise(0.15));
  const trial_starts = Math.round(installs * 0.74 * noise(0.15));
  const activations = poisson(installs * 0.032 + 0.1);
  const dau = Math.round((40 + 1150 * t * t * t + 260 * t) * (weekday === 0 || weekday === 6 ? 0.8 : 1) * noise(0.06));
  const conversions = Math.round(dau * 23 * noise(0.1));
  const failed = Math.round(conversions * 0.006 * noise(0.5));
  daily.push({ day: iso(ts), visitors, downloads, installs, trial_starts, activations, dau, conversions, failed, revenue: activations * PRICE });
}

const KEYS = ["visitors", "downloads", "installs", "trial_starts", "activations", "conversions", "failed", "revenue"];
const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0);
const summarize = (rows) => ({
  ...Object.fromEntries(KEYS.map((k) => [k, sum(rows, k)])),
  avg_dau: Math.round(10 * sum(rows, "dau") / rows.length) / 10,
});

// Split a total across keys by weight with the largest-remainder method, so parts add up exactly.
function split(total, weights) {
  const entries = Object.entries(weights);
  const w = entries.reduce((s, [, v]) => s + v, 0);
  const raw = entries.map(([key, v]) => ({ key, exact: total * v / w }));
  const parts = raw.map((r) => ({ key: r.key, n: Math.floor(r.exact), rest: r.exact % 1 }));
  let left = total - parts.reduce((s, p) => s + p.n, 0);
  [...parts].sort((a, b) => b.rest - a.rest).forEach((p) => { if (left > 0) { p.n++; left--; } });
  return parts.filter((p) => p.n > 0).map(({ key, n }) => ({ key, n })).sort((a, b) => b.n - a.n);
}

const COUNTRY_WEIGHTS = {
  visitors: { US: 23, DE: 9, RU: 8, UZ: 7, UA: 6, GB: 5, KZ: 5, FR: 4, PL: 4, IN: 4, TR: 3, NL: 3, CA: 3, BR: 2, JP: 2, unknown: 3 },
  downloads: { US: 21, DE: 9, RU: 10, UZ: 8, UA: 7, GB: 5, KZ: 6, FR: 4, PL: 4, IN: 3, TR: 3, NL: 3, CA: 3, BR: 2, JP: 1, unknown: 2 },
  installs: { US: 20, DE: 9, RU: 11, UZ: 9, UA: 7, GB: 5, KZ: 6, FR: 4, PL: 4, IN: 3, TR: 3, NL: 3, CA: 3, BR: 1, JP: 1, unknown: 2 },
  trial_starts: { US: 20, DE: 9, RU: 11, UZ: 9, UA: 8, GB: 5, KZ: 6, FR: 4, PL: 4, IN: 2, TR: 3, NL: 3, CA: 3, BR: 1, JP: 1, unknown: 1 },
  activations: { US: 26, DE: 12, RU: 7, UZ: 6, UA: 6, GB: 8, KZ: 4, FR: 5, PL: 4, IN: 1, TR: 2, NL: 5, CA: 5, BR: 1, JP: 2 },
  dau: { US: 22, DE: 10, RU: 11, UZ: 9, UA: 8, GB: 6, KZ: 6, FR: 4, PL: 4, IN: 2, TR: 3, NL: 4, CA: 3, BR: 1, JP: 2, unknown: 1 },
};
COUNTRY_WEIGHTS.mau = COUNTRY_WEIGHTS.dau;

const pick = (list) => list[Math.floor(rand() * list.length)];
const weighted = (weights) => {
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  let r = rand() * total;
  for (const [k, v] of Object.entries(weights)) { r -= v; if (r <= 0) return k; }
  return Object.keys(weights)[0];
};

// ------------------------------------------------------------------ one period
function period(days) {
  const cur = daily.slice(-days);
  const prev = daily.slice(-2 * days, -days);
  const current = summarize(cur), previous = summarize(prev);
  const mau = Math.round(sum(daily.slice(-30), "dau") / 30 * 2.4);
  const wau = Math.round(sum(daily.slice(-7), "dau") / 7 * 1.6);
  const dauToday = daily.at(-1).dau;

  const countries = Object.fromEntries(Object.entries(COUNTRY_WEIGHTS).map(([key, w]) => {
    const total = key === "dau" ? dauToday : key === "mau" ? mau : current[key];
    return [key, split(total, w)];
  }));

  // Funnel: this period's installs, and how far they got by now.
  const permissions = Math.round(current.installs * 0.83);
  const trialStarted = Math.min(permissions, current.trial_starts);
  const funnel = [
    { key: "visitors", value: current.visitors },
    { key: "downloads", value: current.downloads },
    { key: "installs", value: current.installs },
    { key: "permissions", value: permissions },
    { key: "trial_started", value: trialStarted },
    { key: "trial_ended", value: Math.round(trialStarted * (days <= 7 ? 0.35 : 0.62)) },
    { key: "activated", value: current.activations },
  ];
  const prevPermissions = Math.round(previous.installs * 0.81);
  const prevTrial = Math.min(prevPermissions, previous.trial_starts);
  const prev_funnel = [
    { key: "visitors", value: previous.visitors }, { key: "downloads", value: previous.downloads },
    { key: "installs", value: previous.installs }, { key: "permissions", value: prevPermissions },
    { key: "trial_started", value: prevTrial }, { key: "trial_ended", value: Math.round(prevTrial * 0.64) },
    { key: "activated", value: previous.activations },
  ];

  // Buyers: one row per activation in the window, newest first.
  const REFERRERS = { "google.com": 30, direct: 22, "producthunt.com": 14, "news.ycombinator.com": 8, "reddit.com": 8, "t.me": 6, "x.com": 5, "github.com": 4 };
  const UTM = { newsletter: 3, producthunt: 5 };
  const LANDINGS = ["/", "/", "/", "/pricing/", "/blog/fix-wrong-keyboard-layout/", "/compare/"];
  const buyers = [];
  cur.forEach((d) => {
    for (let k = 0; k < d.activations; k++) {
      const activated_at = Date.parse(d.day + "T00:00:00Z") + Math.floor(rand() * dayMs);
      const afterTrial = rand() < 0.58;
      const installGap = afterTrial ? (7 + rand() * 9) * dayMs : (0.2 + rand() * 6) * dayMs;
      const install_at = activated_at - installGap;
      const known = rand() < 0.82;
      const ref = weighted(REFERRERS);
      const utm = rand() < 0.14 ? weighted(UTM) : null;
      const visit_at = install_at - (0.05 + rand() * 30) * 3600e3;
      const download_at = visit_at + (2 + rand() * 25) * 60e3;
      const activeDays = afterTrial ? 3 + Math.floor(rand() * 5) : 1 + Math.floor(rand() * Math.max(1, installGap / dayMs));
      const trial_ended_at = afterTrial ? install_at + 7 * dayMs : null;
      const paywall_at = afterTrial ? trial_ended_at + rand() * 2 * dayMs : rand() < 0.3 ? activated_at - rand() * 40 * 60e3 : null;
      const sinceBuy = (endTs + dayMs - activated_at) / dayMs;
      const afterDays = Math.max(0, Math.min(Math.floor(sinceBuy), Math.round(sinceBuy * (0.55 + rand() * 0.4))));
      buyers.push({
        id: Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0"),
        country: weighted(COUNTRY_WEIGHTS.activations),
        activated_at, install_at,
        permissions_at: install_at + (1 + rand() * 6) * 60e3,
        trial_at: install_at + (5 + rand() * 50) * 60e3,
        trial_ended_at, paywall_at, paywalls: paywall_at ? 1 + Math.floor(rand() * 3) : 0,
        bought: afterTrial ? "after_trial" : "during_trial",
        trial_days: Math.round(10 * Math.min(installGap, 7 * dayMs) / dayMs) / 10,
        trial: { active_days: activeDays, conversions: activeDays * (8 + Math.floor(rand() * 40)) },
        after: { active_days: afterDays, conversions: afterDays * (10 + Math.floor(rand() * 30)), last_seen_at: Math.max(activated_at, endTs + dayMs - (afterDays && rand() < 0.75 ? rand() * 4 : 3 + rand() * 20) * dayMs) },
        os: pick(["15.5", "15.5", "15.4", "14.7", "26.1"]), version: pick(["2.4.1", "2.4.1", "2.4.0", "2.3.2"]),
        upgrade: false,
        source: known ? {
          match: rand() < 0.12 ? "approx" : "exact", visit_at, download_at,
          referrer: ref === "direct" ? null : ref, utm_source: utm, utm_campaign: utm === "producthunt" ? "launch" : null,
          landing: pick(LANDINGS), pages: 1 + Math.floor(rand() * 5), lang: pick(["en", "en", "en", "de", "ru"]),
          site_buy_click: rand() < 0.4,
        } : null,
      });
    }
  });
  buyers.sort((a, b) => b.activated_at - a.activated_at);
  const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const srcKey = (s) => !s ? "unknown" : s.utm_source ? `utm:${s.utm_source}` : s.referrer || "direct";
  const sourceCounts = {};
  buyers.forEach((b) => { const k = srcKey(b.source); sourceCounts[k] = (sourceCounts[k] || 0) + 1; });
  const summary = {
    buyers: buyers.length,
    started_trial: buyers.filter((b) => b.trial_at).length,
    after_trial: buyers.filter((b) => b.bought === "after_trial").length,
    during_trial: buyers.filter((b) => b.bought === "during_trial").length,
    median_days_to_purchase: median(buyers.map((b) => (b.activated_at - b.install_at) / dayMs)),
    median_trial_active_days: median(buyers.map((b) => b.trial.active_days)),
    median_trial_conversions: median(buyers.map((b) => b.trial.conversions)),
    saw_paywall: buyers.filter((b) => b.paywall_at).length,
    median_paywall_to_purchase_min: median(buyers.filter((b) => b.paywall_at).map((b) => (b.activated_at - b.paywall_at) / 60e3)),
    still_active: buyers.filter((b) => endTs + dayMs - b.after.last_seen_at < 7 * dayMs).length,
    sources: Object.entries(sourceCounts).map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n),
  };

  // Weekly install cohorts: share of each cohort active in week k.
  const weeks = Math.min(10, Math.max(2, Math.ceil(days / 7)));
  const retention = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const slice = daily.slice(DAYS - (w + 1) * 7, DAYS - w * 7);
    const size = sum(slice, "installs");
    const curve = [0.58, 0.47, 0.41, 0.38, 0.35, 0.33, 0.32, 0.31, 0.3].map((v) => Math.max(0, Math.min(1, v * noise(0.08))));
    retention.push({ start: slice[0].day, size, weeks: curve.slice(0, w) });
  }

  const visitors = current.visitors;
  const web = {
    referrers: split(Math.round(visitors * 0.64), { "google.com": 38, "producthunt.com": 14, "news.ycombinator.com": 9, "reddit.com": 9, "t.me": 6, "x.com": 6, "github.com": 5, "duckduckgo.com": 4, "bing.com": 3 }).map(({ key, n }) => ({ key, visitors: n })),
    sources: split(Math.round(visitors * 0.07), { newsletter: 5, producthunt: 7, reddit: 2 }).map(({ key, n }) => ({ key, visitors: n })),
    pages: split(Math.round(visitors * 1.9), { "/": 48, "/pricing/": 14, "/download/": 12, "/blog/fix-wrong-keyboard-layout/": 9, "/compare/": 7, "/blog/": 4, "/changelog/": 3, "/privacy/": 2 }).map(({ key, n }) => ({ key, views: n })),
    countries: split(visitors, COUNTRY_WEIGHTS.visitors).map(({ key, n }) => ({ key, visitors: n })),
    languages: split(visitors, { en: 58, de: 9, ru: 15, uz: 7, fr: 4, pl: 4, tr: 3 }).map(({ key, n }) => ({ key, visitors: n })),
    devices: split(visitors, { mac: 71, windows: 12, mobile: 13, tablet: 2, linux: 2 }).map(({ key, n }) => ({ key, visitors: n })),
  };

  const licensed = Math.round(mau * 0.41), trial = Math.round(mau * 0.22);
  const app = {
    active_30d: mau,
    access: [{ key: "licensed", n: licensed }, { key: "trial", n: trial }, { key: "ended", n: Math.round(mau * 0.3) }],
    trial_usage: [{ key: "5–7", n: Math.round(trial * 0.42) }, { key: "3–4", n: Math.round(trial * 0.3) }, { key: "1–2", n: Math.round(trial * 0.2) }, { key: "ended", n: Math.round(mau * 0.3) }],
    permissions: [{ key: "granted", n: Math.round(mau * 0.89) }, { key: "missing", n: Math.round(mau * 0.08) }],
    versions: split(mau, { "2.4.1": 61, "2.4.0": 21, "2.3.2": 11, "2.3.0": 5, "2.2.4": 2 }),
    macos: split(mau, { "15.5": 44, "15.4": 14, "26.1": 18, "14.7": 15, "13.7": 6, "13.6": 3 }),
  };

  const NAMES = ["pageview", "pageview", "pageview", "download", "install", "launch", "active", "first_conversion", "paywall_shown", "license_activated", "buy_click", "updated"];
  const recent = [];
  let ts = endTs + dayMs - 4 * 60e3;
  for (let i = 0; i < 25; i++) {
    const name = pick(NAMES);
    const web = ["pageview", "download", "buy_click"].includes(name);
    recent.push({
      ts, name, source: web ? "web" : "app", country: weighted(COUNTRY_WEIGHTS.visitors).replace("unknown", ""),
      path: web ? pick(["/", "/pricing/", "/download/", "/blog/fix-wrong-keyboard-layout/"]) : undefined,
      referrer: web && rand() < 0.5 ? pick(["google.com", "producthunt.com", "t.me"]) : undefined,
      os: web ? pick(["mac", "mac", "windows", "mobile"]) : pick(["15.5", "15.4", "26.1"]),
      version: web ? undefined : pick(["2.4.1", "2.4.0"]),
      props: name === "paywall_shown" ? { reason: "trial_ended" } : undefined,
    });
    ts -= (1 + rand() * 9) * 60e3;
  }

  const allTime = daily;
  return {
    period: { days, start: cur[0].day, end: cur.at(-1).day },
    generated_at: endTs + dayMs + 9 * 3600e3,
    current, previous,
    series: cur,
    totals: {
      first_day: daily[0].day, dau_today: dauToday, wau, mau,
      customers: sum(allTime, "activations"), revenue: sum(allTime, "revenue"),
      payments_synced_at: endTs + dayMs + 9 * 3600e3 - 3 * 60e3,
    },
    activation_days: summary.median_days_to_purchase,
    countries, funnel, prev_funnel,
    // The table shows the newest 50; the summary above counts every buyer in the window.
    journeys: { buyers: buyers.slice(0, 50), summary },
    retention, web, app, recent,
  };
}

const out = Object.fromEntries(PERIODS.map((d) => [d, period(d)]));
const file = fileURLToPath(new URL("./sample-data.js", import.meta.url));
writeFileSync(file, `// Generated by sample-data.mjs. Made-up data for a fictional app; do not edit by hand.\nwindow.SAMPLE = ${JSON.stringify(out)};\n`);
const c30 = out[30].current;
console.log(`wrote ${file}`);
console.log(`30 days: ${c30.visitors} visitors, ${c30.downloads} downloads, ${c30.installs} installs, ${c30.activations} sales, $${c30.revenue / 100}`);
