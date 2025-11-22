# Database Setup Guide

## Quick Setup

The Daemon Social Network uses PostgreSQL to store user data, posts, and network information.

### For Ubuntu/Debian

```bash
# 1. Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 2. Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot

# 3. Create database user and database
sudo -u postgres psql << EOF
CREATE USER daemon WITH PASSWORD 'daemon_password';
CREATE DATABASE daemon OWNER daemon;
GRANT ALL PRIVILEGES ON DATABASE daemon TO daemon;
\q
EOF

# 4. Run schema setup
cd ~/daemon
sudo -u postgres psql -d daemon -f backend/db/social-schema.sql

# Or if you prefer to use the daemon user:
psql -U daemon -d daemon -h localhost -f backend/db/social-schema.sql
```

### For CentOS/RHEL

```bash
# 1. Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib

# 2. Initialize database
sudo postgresql-setup initdb

# 3. Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Create database user and database (same as above)
sudo -u postgres psql << EOF
CREATE USER daemon WITH PASSWORD 'daemon_password';
CREATE DATABASE daemon OWNER daemon;
GRANT ALL PRIVILEGES ON DATABASE daemon TO daemon;
\q
EOF

# 5. Run schema
cd ~/daemon
sudo -u postgres psql -d daemon -f backend/db/social-schema.sql
```

### For macOS

```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb daemon

# Run schema
psql -d daemon -f backend/db/social-schema.sql
```

### For Windows

```powershell
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/

# After installation, open PowerShell as Administrator:
# Create database
psql -U postgres
CREATE DATABASE daemon;
CREATE USER daemon WITH PASSWORD 'daemon_password';
GRANT ALL PRIVILEGES ON DATABASE daemon TO daemon;
\q

# Run schema
psql -U daemon -d daemon -f backend\db\social-schema.sql
```

## Configure Database URL

After setting up PostgreSQL, add to your `.env` file:

```env
DATABASE_URL=postgresql://daemon:daemon_password@localhost:5432/daemon
```

**Replace `daemon_password` with your actual password!**

## Verify Installation

```bash
# Test database connection
psql -U daemon -d daemon -h localhost -c "SELECT 1;"

# Check if tables were created
psql -U daemon -d daemon -h localhost -c "\dt"

# You should see tables like: users, messages, profiles, follows, etc.
```

## Troubleshooting

### PostgreSQL not running
```bash
# Check status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql
```

### Connection refused
```bash
# Check if PostgreSQL is listening
sudo ss -tlnp | grep 5432

# Check PostgreSQL config
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses

# Should be: listen_addresses = '*' or 'localhost'
```

### Authentication failed
```bash
# Check pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# May need to set:
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
```

### Permission denied
```bash
# Make sure user has permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE daemon TO daemon;"
sudo -u postgres psql -d daemon -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO daemon;"
sudo -u postgres psql -d daemon -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO daemon;"
```

## Running Without Database (Limited Functionality)

If you don't want to set up PostgreSQL yet, the node will still run but with limited functionality:
- ✅ Hub: Works (stores messages in memory)
- ✅ PDS: Works (stores user data in memory)
- ⚠️ Gateway: Works but returns empty feeds (no database for follows)

To run without database, just don't set `DATABASE_URL` in `.env`:

```env
# DATABASE_URL=  # Commented out - node will work without database
```

The feed endpoint will return empty arrays instead of crashing.

## Quick Setup Script

You can use this one-liner script:

```bash
# Ubuntu/Debian
curl -fsSL https://raw.githubusercontent.com/dutchiono/daemon_protocol/main/scripts/setup-database.sh | bash
```

Or create `scripts/setup-database.sh`:

```bash
#!/bin/bash
set -e

echo "Setting up PostgreSQL for Daemon Social Network..."

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER daemon WITH PASSWORD 'daemon_password';
CREATE DATABASE daemon OWNER daemon;
GRANT ALL PRIVILEGES ON DATABASE daemon TO daemon;
\q
EOF

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Run schema
if [ -f "$PROJECT_ROOT/backend/db/social-schema.sql" ]; then
    echo "Running database schema..."
    sudo -u postgres psql -d daemon -f "$PROJECT_ROOT/backend/db/social-schema.sql"
else
    echo "Schema file not found. Please run schema manually:"
    echo "  psql -U postgres -d daemon -f backend/db/social-schema.sql"
fi

echo "✅ Database setup complete!"
echo ""
echo "Add to your .env file:"
echo "  DATABASE_URL=postgresql://daemon:daemon_password@localhost:5432/daemon"
```

## Next Steps

1. ✅ Database installed and running
2. ✅ Database created (`daemon`)
3. ✅ Schema applied (`social-schema.sql`)
4. ✅ `DATABASE_URL` configured in `.env`
5. ✅ Restart your node: `npm start all` or `pm2 restart all`

---

## Manual Schema Application

If you prefer to apply the schema manually:

```bash
# 1. Connect to database
psql -U daemon -d daemon -h localhost

# 2. Copy and paste the contents of backend/db/social-schema.sql
#    Or use \i command:
\i backend/db/social-schema.sql

# 3. Verify tables were created
\dt

# 4. Exit
\q
```

