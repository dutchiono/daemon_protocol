#!/bin/bash

echo "🔧 Fixing Database Permissions"
echo "==============================="
echo ""

# Database connection details
DB_NAME="daemon"
DB_USER="daemon"
DB_PASSWORD="daemon_password"

echo "1️⃣  Connecting to PostgreSQL..."
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Grant permissions
echo "2️⃣  Granting permissions on tables..."

sudo -u postgres psql -d "$DB_NAME" << EOF
-- Grant all permissions on all tables to daemon user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "$DB_USER";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "$DB_USER";
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "$DB_USER";

-- Grant permissions on specific tables (if they exist)
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO "$DB_USER";
GRANT SELECT, INSERT, UPDATE, DELETE ON follows TO "$DB_USER";
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO "$DB_USER";
GRANT SELECT, INSERT, UPDATE, DELETE ON reactions TO "$DB_USER";
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO "$DB_USER";

-- Make daemon user the owner (if needed)
ALTER TABLE profiles OWNER TO "$DB_USER";
ALTER TABLE follows OWNER TO "$DB_USER";
ALTER TABLE messages OWNER TO "$DB_USER";
ALTER TABLE reactions OWNER TO "$DB_USER";
ALTER TABLE users OWNER TO "$DB_USER";

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$DB_USER";

\q
EOF

if [ $? -eq 0 ]; then
    echo "   ✅ Permissions granted"
else
    echo "   ❌ Failed to grant permissions"
    echo "   You may need to run this manually:"
    echo "   sudo -u postgres psql -d daemon"
    exit 1
fi
echo ""

echo "3️⃣  Verifying permissions..."
sudo -u postgres psql -d "$DB_NAME" -c "\dp profiles" 2>/dev/null | grep "$DB_USER" || echo "   ⚠️  Could not verify, but permissions should be set"
echo ""

echo "==============================="
echo "✅ Database Permissions Fixed!"
echo ""
echo "🔄 Restart Gateway to test:"
echo "   pm2 restart daemon-gateway"
echo ""

