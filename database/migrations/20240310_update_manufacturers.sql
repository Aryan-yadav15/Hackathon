-- Remove password_hash column since we're using Supabase Auth
ALTER TABLE manufacturers 
DROP COLUMN password_hash; 

-- Make password_hash nullable since we're using Supabase Auth
ALTER TABLE manufacturers 
ALTER COLUMN password_hash DROP NOT NULL; 

-- Add password column for NextAuth
ALTER TABLE manufacturers 
ADD COLUMN password_hash TEXT NOT NULL; 