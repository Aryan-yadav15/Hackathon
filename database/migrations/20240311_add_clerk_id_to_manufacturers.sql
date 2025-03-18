-- Add clerk_id to manufacturers
ALTER TABLE manufacturers 
ADD COLUMN clerk_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_manufacturers_clerk_id ON manufacturers(clerk_id); 