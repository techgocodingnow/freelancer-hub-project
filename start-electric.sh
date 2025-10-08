#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting Electric SQL for Freelancer Hub..."
echo ""

# Stop and remove old Electric container
echo "🧹 Cleaning up old Electric container..."
docker rm -f electric 2>/dev/null

# Start Electric with insecure mode for development
echo "📦 Starting Electric Docker container..."
docker run -d \
  --name electric \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
  -e ELECTRIC_INSECURE=true \
  electricsql/electric:latest

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to start Electric container${NC}"
  exit 1
fi

# Wait for container to be healthy
echo "⏳ Waiting for Electric to be healthy..."
for i in {1..10}; do
  if docker ps | grep -q "electric.*healthy"; then
    echo -e "${GREEN}✅ Electric is running and healthy!${NC}"
    echo ""
    echo "📍 Electric URL: http://localhost:3000/v1/shape"
    echo ""
    echo "🔍 To view logs:"
    echo "   docker logs -f electric"
    echo ""
    echo "🛑 To stop Electric:"
    echo "   docker stop electric"
    echo ""
    exit 0
  fi
  sleep 1
done

# If we get here, container didn't become healthy
echo -e "${RED}❌ Electric failed to become healthy. Check logs:${NC}"
docker logs electric
exit 1

