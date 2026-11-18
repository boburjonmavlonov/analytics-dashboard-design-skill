#!/bin/sh
# Re-takes every screenshot in docs/images from examples/product-analytics.html.
#
#   python3 -m http.server 4340 &      # from the repo root
#   sh tools/screenshots.sh
#
# Needs Google Chrome (headless) and macOS `sips` for the JPEG conversion.
set -eu
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
BASE="${BASE:-http://localhost:4340/examples/product-analytics.html}"
OUT=docs/images
TMP=$(mktemp -d)
mkdir -p "$OUT"

shot() { # name width height query
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --virtual-time-budget=4000 --window-size="$2,$3" --screenshot="$TMP/$1.png" "$BASE?$4" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 82 "$TMP/$1.png" --out "$OUT/$1.jpg" >/dev/null
  echo "$OUT/$1.jpg"
}

shot dashboard-light 1440 980  "theme=light"
shot dashboard-dark  1440 980  "theme=dark"
shot overview        1280 610  "theme=light&only=overview"
shot countries       1280 1030 "theme=light&only=geo"
shot funnel          1280 560  "theme=light&only=funnel"
shot buyers          1280 1420 "theme=light&only=buyers&open=1"
shot app             1280 940  "theme=light&only=app"
shot retention       1280 380  "theme=light&only=retention"
shot website         1280 1290 "theme=light&only=web"
shot revenue-90d     1280 610  "theme=light&only=overview&days=90&metric=revenue"
phone() { # name height query — rendered at 390 px inside tools/phone-frame.html, then cropped
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --virtual-time-budget=4000 --window-size="600,$2" --screenshot="$TMP/$1.png" "${BASE%/examples/*}/tools/phone-frame.html?$3" >/dev/null 2>&1
  sips -c $(($2 * 2)) 780 "$TMP/$1.png" >/dev/null   # centre crop to the iframe
  sips -s format jpeg -s formatOptions 82 "$TMP/$1.png" --out "$OUT/$1.jpg" >/dev/null
  echo "$OUT/$1.jpg"
}
phone phone       1500 "theme=light"
phone phone-dark  1500 "theme=dark&only=buyers&open=1"
rm -rf "$TMP"
