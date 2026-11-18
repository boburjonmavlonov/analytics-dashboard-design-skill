# Privacy-first tracking

A product dashboard needs counts, not people. Everything on the example page can be computed from the events
below without cookies, without stored IP addresses and without anything a user typed.

## Website

- **No cookies, no local storage IDs.** A visitor is a daily salted hash: `hash(salt_of_the_day | ip | user_agent)`,
  truncated. The IP is never stored, and the salt changes every day, so the same person gets a different hash
  tomorrow and can't be followed across days. That's why period visitors are "sum of daily uniques"
  ([metrics.md](metrics.md#uniques)).
- **Pick the salt's strength on purpose.** Deriving it from a server secret and the date
  (`hash("salt" | secret | day)`) is simple and survives restarts, but whoever holds the secret could test a known
  IP against old hashes. A random salt kept only in memory (or in a key-value store with a one-day expiry) and
  thrown away at midnight is stronger: after that day, nobody can recompute anything.
- **Store the country, not the IP.** Most edges give you the country (`CF-IPCountry`, `cf.country`). Keep the
  two-letter code; drop the address.
- **Referrer as a domain, path as a path.** Strip query strings except `utm_*`. Never store full referrer URLs:
  they can carry search terms and tokens.
- **Events:** `pageview`, `download`, `buy_click`. Each with day, country, path, referrer domain, utm fields,
  language, device class (mac / windows / mobile / tablet / linux).

## App

- **A random install ID**, generated on first launch and stored in the app's preferences. It identifies an
  installation, not a person or a device serial, and it resets on reinstall.
- **Events:** `install`, `launch`, `active` (once a day, with counts), `permissions_granted`,
  `first_conversion` (trial start), `trial_ended`, `paywall_shown`, `license_activated`, `updated`, `opt_out`.
  Properties are versions and counts only.
- **Never the content.** For an app that touches what people type, say so in the UI and in the privacy policy:
  "Sends only a random install ID, the app and macOS versions, and how many actions worked. Never what you type
  or which apps you use."
- **Opt-out in Preferences.** Turning statistics off sends one `opt_out` event (so the drop in DAU is
  explainable) and then nothing.

## Joining website and app

The two share no ID, and they shouldn't. To show where buyers came from:

- The download and the install each store a **network hash**: `hash("net" | salt_of_the_day | ip)`. The same network on
  the same day gives the same hash; nothing else can be learned from it.
- An install is linked to a download with the same hash in the two days before it (store the previous day's
  hash too, so a download at 23:50 still matches an install at 00:10).
- Without a hash match, fall back to country and time, and say so (`approx.`). With several candidates, say
  "Unknown". See [metrics.md](metrics.md#attribution).
- Show buyers by short install-ID fragment ("Mac #6e9b53") and country. No emails or names on the dashboard,
  even if the payment provider has them.

## What never to collect

| Don't | Why |
|---|---|
| IP addresses | personal data in most jurisdictions; the country and a daily hash are enough |
| Full URLs with query strings | leak search terms, tokens and emails |
| Keystrokes, text, window titles, app names | the thing users fear most from a utility |
| Fingerprints (canvas, fonts, hardware) | tracking by another name |
| Emails or names next to behaviour | joins analytics to identity |

## Access

The dashboard itself is private: a login (or an edge access policy) in front of it, `noindex, nofollow` on the
page, and a session cookie scoped to the dashboard host only.
