-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables in the correct order (to avoid foreign key conflicts)
TRUNCATE TABLE workflow_edges CASCADE;
TRUNCATE TABLE workflow_nodes CASCADE;
TRUNCATE TABLE workflows CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE manufacturers CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- workflow_nodes table
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- workflow_edges table
CREATE TABLE IF NOT EXISTS workflow_edges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS workflow_nodes_user_id_idx ON workflow_nodes(user_id);
CREATE INDEX IF NOT EXISTS workflow_edges_user_id_idx ON workflow_edges(user_id); 