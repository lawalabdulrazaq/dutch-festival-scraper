#!/bin/bash

# Test script to validate Supabase setup
# Usage: bash test_supabase.sh

echo "🧪 Testing Supabase Setup..."
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env file
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  exit 1
fi

echo -e "${YELLOW}📋 Checking .env configuration...${NC}"

# Extract values from .env
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d= -f2 | tr -d ' ')
SUPABASE_SERVICE_KEY=$(grep "^SUPABASE_SERVICE_KEY=" .env | cut -d= -f2 | tr -d ' ')
CLIENT_ENDPOINT=$(grep "^CLIENT_ENDPOINT=" .env | cut -d= -f2 | tr -d ' ')
CLIENT_API_KEY=$(grep "^CLIENT_API_KEY=" .env | cut -d= -f2 | tr -d ' ')

# Validate
[[ -z "$SUPABASE_URL" ]] && echo -e "${RED}❌ SUPABASE_URL not set${NC}" && exit 1
[[ -z "$SUPABASE_SERVICE_KEY" ]] && echo -e "${RED}❌ SUPABASE_SERVICE_KEY not set${NC}" && exit 1
[[ -z "$CLIENT_ENDPOINT" ]] && echo -e "${RED}❌ CLIENT_ENDPOINT not set${NC}" && exit 1
[[ -z "$CLIENT_API_KEY" ]] && echo -e "${RED}❌ CLIENT_API_KEY not set${NC}" && exit 1

echo -e "${GREEN}✅ All environment variables configured${NC}"
echo ""
echo -e "${YELLOW}🌐 Configuration Details:${NC}"
echo "   SUPABASE_URL: ${SUPABASE_URL:0:50}..."
echo "   CLIENT_ENDPOINT: ${CLIENT_ENDPOINT:0:50}..."
echo ""

# Test connectivity
echo -e "${YELLOW}🔗 Testing Supabase connectivity...${NC}"

curl -s -X OPTIONS "$CLIENT_ENDPOINT" \
  -H "Authorization: Bearer $CLIENT_API_KEY" \
  -H "Content-Type: application/json" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Edge function is reachable${NC}"
else
  echo -e "${RED}❌ Could not reach edge function (404 is OK if function not deployed yet)${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Ready to run: npm run test${NC}"
echo ""
