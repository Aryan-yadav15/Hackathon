-- Add invoice templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    header_text TEXT,
    footer_text TEXT,
    company_details TEXT,
    logo_url VARCHAR(255),
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id)
);

-- Add trigger for invoice_templates
CREATE TRIGGER update_invoice_templates_timestamp
    BEFORE UPDATE ON invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add index
CREATE INDEX IF NOT EXISTS idx_invoice_templates_manufacturer_id 
    ON invoice_templates(manufacturer_id); 