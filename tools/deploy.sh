#!/usr/bin/env bash
# Deploy vspickleball.com to the shared VPS and ping IndexNow.
#   bash tools/deploy.sh            # upload + submit every URL in sitemap.xml
#   bash tools/deploy.sh --no-ping  # upload only
# Only the public files go up; nothing in nginx is touched.
set -euo pipefail
cd "$(dirname "$0")/.."

KEY=~/.ssh/mma_sim_key
HOST=root@45.77.87.102
DEST=/var/www/vspickleball.com/public_html
INDEXNOW_KEY=02d3404e974f4b929fdd0e619fca831e
FILES=(index.html about.html how-to-play.html privacy.html css js favicon.svg manifest.webmanifest og.jpg robots.txt sitemap.xml "$INDEXNOW_KEY.txt")

scp -i "$KEY" -o BatchMode=yes -r "${FILES[@]}" "$HOST:$DEST/"
ssh -i "$KEY" -o BatchMode=yes "$HOST" "chown -R root:www-data $DEST && find $DEST -type d -exec chmod 755 {} \; && find $DEST -type f -exec chmod 644 {} \;"
echo "uploaded: $(curl -s -o /dev/null -w '%{http_code}' https://vspickleball.com/)"

[[ "${1:-}" == "--no-ping" ]] && exit 0

urls=$(grep -o '<loc>[^<]*</loc>' sitemap.xml | sed 's#</\?loc>##g' | sed 's/.*/"&"/' | paste -sd, -)
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/IndexNow \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"vspickleball.com\",\"key\":\"$INDEXNOW_KEY\",\"keyLocation\":\"https://vspickleball.com/$INDEXNOW_KEY.txt\",\"urlList\":[$urls]}")
echo "indexnow: HTTP $code"
