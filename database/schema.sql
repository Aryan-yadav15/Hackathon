-- Manufacturers table (your main users)
CREATE TABLE manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT NOT NULL
);

-- Retailers table (manufacturers' clients)
CREATE TABLE retailers (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, email)
);

-- Products table (belonging to manufacturer)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, sku)
);

-- Orders table (emails from retailers to manufacturers)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    retailer_id INTEGER REFERENCES retailers(id),
    order_number VARCHAR(100),
    email_subject VARCHAR(255),
    email_body TEXT,
    email_received_at TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'validated', 'invalid', 'error')),
    validation_errors JSONB,
    email_parsed_data JSONB,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, order_number)
);

-- Order items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UiPath Agents (belonging to manufacturers)
CREATE TABLE uipath_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID REFERENCES manufacturers(id) UNIQUE,
    agent_key VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Processing logs
CREATE TABLE processing_logs (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    order_id INTEGER REFERENCES orders(id),
    log_type VARCHAR(50) NOT NULL 
        CHECK (log_type IN ('parsing', 'validation', 'error')),
    message TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add email configurations table
CREATE TABLE email_configurations (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    email VARCHAR(255) NOT NULL,
    folder VARCHAR(50) DEFAULT 'INBOX',
    subject_pattern VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, email)
);


CREATE TABLE product_exceptions (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    product_id INTEGER REFERENCES products(id),
    rule_type VARCHAR(50),
    value NUMERIC,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    manufacturer_id UUID REFERENCES manufacturers(id),
    name VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_nodes (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    type VARCHAR(50),
    position_x INTEGER,
    position_y INTEGER,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_edges (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    source_node_id INTEGER REFERENCES workflow_nodes(id),
    target_node_id INTEGER REFERENCES workflow_nodes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- Indexes
CREATE INDEX idx_manufacturers_email ON manufacturers(email);
CREATE INDEX idx_retailers_manufacturer_id ON retailers(manufacturer_id);
CREATE INDEX idx_retailers_email ON retailers(email);
CREATE INDEX idx_products_manufacturer_id ON products(manufacturer_id);
CREATE INDEX idx_orders_manufacturer_id ON orders(manufacturer_id);
CREATE INDEX idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_orders_processing_status ON orders(processing_status);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_manufacturers_timestamp
    BEFORE UPDATE ON manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_retailers_timestamp
    BEFORE UPDATE ON retailers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_products_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_orders_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_uipath_agents_timestamp
    BEFORE UPDATE ON uipath_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_processing_logs_timestamp
    BEFORE UPDATE ON processing_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add trigger for email_configurations
CREATE TRIGGER update_email_configurations_timestamp
    BEFORE UPDATE ON email_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp(); 