-- Clear Database for Fresh Start
-- This script clears all user-related data to allow clean signup testing

-- Clear PDS users table (Personal Data Server user accounts)
TRUNCATE TABLE pds_users CASCADE;

-- Clear Gateway users table (Gateway user accounts)
TRUNCATE TABLE users CASCADE;

-- Clear profiles table (User profile information)
TRUNCATE TABLE profiles CASCADE;

-- Optional: Uncomment below to clear ALL data for complete fresh start
-- This will also clear posts, reactions, follows, notifications, etc.
-- TRUNCATE TABLE posts CASCADE;
-- TRUNCATE TABLE reactions CASCADE;
-- TRUNCATE TABLE follows CASCADE;
-- TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE pds_records CASCADE;

-- Verify tables are empty
SELECT 'pds_users' as table_name, COUNT(*) as row_count FROM pds_users
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

