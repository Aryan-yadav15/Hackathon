-- Add product exceptions table
CREATE TABLE IF NOT EXISTS product_exceptions (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    product_id INTEGER REFERENCES products(id),
    rule_type VARCHAR(50) NOT NULL CHECK (
        rule_type IN ('quantity_min', 'quantity_max', 'price_min', 'price_max')
    ),
    value DECIMAL(10,2) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for product_exceptions
CREATE TRIGGER update_product_exceptions_timestamp
    BEFORE UPDATE ON product_exceptions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_product_exceptions_manufacturer_id 
    ON product_exceptions(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_product_exceptions_product_id 
    ON product_exceptions(product_id); 