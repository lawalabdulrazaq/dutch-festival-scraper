#!/bin/bash
# This script creates the required tables in Supabase
# Usage: bash create-tables.sh
# Note: Requires curl and jq, and SUPABASE_URL + SUPABASE_SERVICE_KEY in .env

set -e

# Load environment variables
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  exit 1
fi

SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep "^SUPABASE_SERVICE_KEY=" .env | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env"
  exit 1
fi

echo "🔧 Setting up Supabase database..."
echo "📍 Supabase URL: $SUPABASE_URL"

# Read SQL file
SQL=$(cat create-tables.sql)

echo "📝 Sending SQL to Supabase..."

# Use curl to execute the SQL via Supabase API
# Note: This requires direct database access, which is NOT available via the standard REST API
# You need to execute this in the Supabase dashboard SQL editor instead

echo ""
echo "⚠️  Cannot execute SQL via API. Please manually execute in Supabase dashboard:"
echo ""
echo "1. Go to: $SUPABASE_URL/project/_/sql/new"
echo "2. Copy and paste the contents of create-tables.sql"
echo "3. Click 'Run'"
echo ""
echo "📄 SQL content:"
echo "---"
cat create-tables.sql
echo "---"
