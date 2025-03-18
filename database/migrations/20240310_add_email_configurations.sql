-- Add email configurations table
CREATE TABLE IF NOT EXISTS email_configurations (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    email VARCHAR(255) NOT NULL,
    folder VARCHAR(50) DEFAULT 'INBOX',
    subject_pattern VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, email)
);

-- Add trigger for email_configurations
CREATE TRIGGER update_email_configurations_timestamp
    BEFORE UPDATE ON email_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_configurations_manufacturer_id 
    ON email_configurations(manufacturer_id); 