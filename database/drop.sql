-- Drop all tables in the correct order (to handle foreign key constraints)
DROP TABLE IF EXISTS processing_logs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS retailers CASCADE;
DROP TABLE IF EXISTS uipath_agents CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_timestamp CASCADE; 