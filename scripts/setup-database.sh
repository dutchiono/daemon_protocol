#!/bin/bash
set -e

echo "=========================================="
echo "Daemon Social Network - Database Setup"
echo "=========================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
        OS="debian"
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
    else
        OS="linux"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    OS="unknown"
fi

echo "Detected OS: $OS"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed."
    echo ""
    
    if [ "$OS" == "debian" ]; then
        echo "Installing PostgreSQL (Ubuntu/Debian)..."
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    elif [ "$OS" == "rhel" ]; then
        echo "Installing PostgreSQL (CentOS/RHEL)..."
        sudo yum install -y postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
    elif [ "$OS" == "macos" ]; then
        echo "Installing PostgreSQL (macOS)..."
        if command -v brew &> /dev/null; then
            brew install postgresql@15
            brew services start postgresql@15
        else
            echo "❌ Homebrew not found. Please install PostgreSQL manually:"
            echo "   https://www.postgresql.org/download/macosx/"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install PostgreSQL manually:"
        echo "   https://www.postgresql.org/download/"
        exit 1
    fi
    echo "✅ PostgreSQL installed"
else
    echo "✅ PostgreSQL is already installed"
    psql --version
fi

echo ""

# Start PostgreSQL service
if [ "$OS" != "macos" ]; then
    echo "Starting PostgreSQL service..."
    sudo systemctl start postgresql 2>/dev/null || true
    sudo systemctl enable postgresql 2>/dev/null || true
    echo "✅ PostgreSQL service started"
fi

echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default password (user should change this)
DB_PASSWORD="${DAEMON_DB_PASSWORD:-daemon_password}"
DB_USER="daemon"
DB_NAME="daemon"

echo "Creating database and user..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Create database and user
if [ "$OS" == "macos" ]; then
    # macOS - may not need sudo
    createdb "$DB_NAME" 2>/dev/null || echo "Database may already exist"
    createuser "$DB_USER" 2>/dev/null || echo "User may already exist"
else
    # Linux - use postgres user
    sudo -u postgres psql << EOF || true
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
fi

echo "✅ Database and user created"
echo ""

# Find schema file
SCHEMA_FILE="$PROJECT_ROOT/backend/db/social-schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "⚠️  Schema file not found at: $SCHEMA_FILE"
    echo "   Please run the schema manually:"
    echo "   psql -U $DB_USER -d $DB_NAME -f backend/db/social-schema.sql"
else
    echo "Applying database schema..."
    
    # Set PGPASSWORD for non-interactive connection
    export PGPASSWORD="$DB_PASSWORD"
    
    if [ "$OS" == "macos" ]; then
        psql -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE" || echo "⚠️  Schema application had errors (tables may already exist)"
    else
        sudo -u postgres psql -d "$DB_NAME" -f "$SCHEMA_FILE" || echo "⚠️  Schema application had errors (tables may already exist)"
    fi
    
    unset PGPASSWORD
    
    echo "✅ Schema applied"
fi

echo ""
echo "=========================================="
echo "✅ Database Setup Complete!"
echo "=========================================="
echo ""
echo "Add this to your .env file:"
echo ""
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "Or set a custom password:"
echo "export DAEMON_DB_PASSWORD='your_password'"
echo "./scripts/setup-database.sh"
echo ""

