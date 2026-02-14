#!/bin/bash
# =============================================================================
# PostgreSQL Migration Script
# =============================================================================
#
# This script helps migrate from SQLite to PostgreSQL for production.
#
# Prerequisites:
#   1. PostgreSQL database provisioned (e.g., Railway, Supabase, Neon, or AWS RDS)
#   2. DATABASE_URL environment variable set to PostgreSQL connection string
#      Example: postgresql://user:password@host:5432/truefans_radio?sslmode=require
#
# Usage:
#   chmod +x scripts/migrate-to-postgres.sh
#   DATABASE_URL="postgresql://..." ./scripts/migrate-to-postgres.sh
#
# =============================================================================

set -e

echo "============================================="
echo "TrueFans Radio — PostgreSQL Migration"
echo "============================================="
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo ""
  echo "Set it to your PostgreSQL connection string:"
  echo "  export DATABASE_URL=\"postgresql://user:password@host:5432/truefans_radio\""
  echo ""
  exit 1
fi

# Check it's actually PostgreSQL
if [[ "$DATABASE_URL" != postgresql* ]]; then
  echo "ERROR: DATABASE_URL does not appear to be a PostgreSQL URL."
  echo "Current value starts with: ${DATABASE_URL:0:20}..."
  echo ""
  exit 1
fi

echo "Target database: ${DATABASE_URL:0:40}..."
echo ""

# Step 1: Update schema provider
echo "[1/4] Updating Prisma schema provider to PostgreSQL..."
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
echo "  Done. (backup saved as prisma/schema.prisma.bak)"
echo ""

# Step 2: Generate Prisma client
echo "[2/4] Generating Prisma client..."
npx prisma generate
echo "  Done."
echo ""

# Step 3: Push schema to PostgreSQL
echo "[3/4] Pushing schema to PostgreSQL..."
npx prisma db push --accept-data-loss
echo "  Done."
echo ""

# Step 4: Seed data
echo "[4/4] Running seed scripts..."
echo "  You can now run: npx tsx scripts/seed-all-teams.ts"
echo ""

echo "============================================="
echo "Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Run seed scripts if this is a fresh database"
echo "  2. Update your .env.production with the PostgreSQL URL"
echo "  3. Update Netlify environment variables"
echo "  4. Deploy: npx netlify-cli deploy --prod"
echo "============================================="
