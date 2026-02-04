#!/bin/bash
# VentureClaw Deployment Health Check

URLS=(
  "https://ventureclaw.vercel.app"
  "https://ventureclaw-eli5defis-projects.vercel.app"
)

echo "🔍 Checking VentureClaw deployment health..."
echo ""

for URL in "${URLS[@]}"; do
  echo "Testing: $URL/api/health"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" "$URL/api/health" 2>/dev/null)
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ LIVE - HTTP $HTTP_CODE"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "🎉 VentureClaw is deployed and running!"
    echo "🌐 Visit: $URL"
    exit 0
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "⏳ Building... - HTTP $HTTP_CODE (deployment in progress)"
  else
    echo "❌ Error - HTTP $HTTP_CODE"
  fi
  echo ""
done

echo "💡 Deployment still processing. Check Vercel dashboard:"
echo "   https://vercel.com/eli5defis-projects/ventureclaw"
