import express from 'express';
import supabase from '../../db/index.js';
import validator from 'validator';

const router = express.Router();

// Register new UiPath agent
router.post('/agents', async (req, res) => {
    const { manufacturer_id, agent_key } = req.body;

    try {
        // Check if manufacturer already has an agent
        const { data: existingAgent, error: checkError } = await supabase
            .from('uipath_agents')
            .select('id')
            .eq('manufacturer_id', manufacturer_id)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingAgent) {
            return res.status(400).json({
                error: 'Manufacturer already has a registered agent'
            });
        }

        // Register new agent
        const { data, error } = await supabase
            .from('uipath_agents')
            .insert([{
                manufacturer_id,
                agent_key,
                status: 'pending',
                last_heartbeat: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to register agent: ${error.message}`
        });
    }
});

// Update agent heartbeat
router.patch('/agents/:id/heartbeat', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('uipath_agents')
            .update({
                last_heartbeat: new Date().toISOString(),
                status: 'active'
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to update heartbeat: ${error.message}`
        });
    }
});

// Get agent status for manufacturer
router.get('/agents/manufacturer/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('uipath_agents')
            .select('id, agent_key, status, last_heartbeat')
            .eq('manufacturer_id', req.params.id)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                error: 'No agent found for this manufacturer'
            });
        }

        // Check if agent is stale (no heartbeat in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(data.last_heartbeat) < fiveMinutesAgo) {
            // Update status to inactive
            const { data: updatedData, error: updateError } = await supabase
                .from('uipath_agents')
                .update({ status: 'inactive' })
                .eq('id', data.id)
                .select()
                .single();

            if (updateError) throw updateError;
            data.status = updatedData.status;
        }

        res.json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to fetch agent status: ${error.message}`
        });
    }
});

// UiPath webhook handler
router.post('/webhook', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('Received order data:', orderData);

        // Validate required fields and types
        const requiredFields = {
            manufacturer_email: 'string',
            retailer_email: 'string',
            email_subject: 'string',
            email_body: 'string',
            products: 'object'
        };

        // Trim and validate emails
        orderData.manufacturer_email = orderData.manufacturer_email?.trim();
        orderData.retailer_email = orderData.retailer_email?.trim();

        if (!validator.isEmail(orderData.manufacturer_email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid manufacturer email format'
            });
        }

        if (!validator.isEmail(orderData.retailer_email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid retailer email format'
            });
        }

        // Manufacturer lookup by email
        const { data: manufacturer, error: mError } = await supabase
            .from('manufacturers')
            .select('id')
            .eq('email', orderData.manufacturer_email)
            .maybeSingle();

        if (mError || !manufacturer) {
            return res.status(400).json({
                success: false,
                error: 'Manufacturer not found'
            });
        }

        // Retailer lookup by email
        const { data: retailer, error: rError } = await supabase
            .from('retailers')
            .select('id')
            .eq('email', orderData.retailer_email)
            .maybeSingle();

        if (rError || !retailer) {
            return res.status(400).json({
                success: false,
                error: 'Retailer not found'
            });
        }

        for (const [field, type] of Object.entries(requiredFields)) {
            if (!orderData[field]) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required field: ${field}`
                });
            }

            if (field === 'products') {
                if (!Array.isArray(orderData[field])) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid type for products. Expected array`
                    });
                }
            } else if (typeof orderData[field] !== type) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid type for ${field}. Expected ${type}`
                });
            }
        }

        // Validate products array structure
        if (!orderData.products.every(product =>
            product.name && typeof product.name === 'string' &&
            product.quantity && typeof product.quantity === 'number'
        )) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product structure. Each product must have name (string) and quantity (number)'
            });
        }

        // Get product details by names
        const productNames = orderData.products.map(p => p.name);

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, price')
            .eq('manufacturer_id', manufacturer.id)
            .or(productNames.map(name => `name.ilike.${name}`).join(','));

        if (productsError) throw productsError;

        res.json({
            success: true,
            message: 'Webhook data processed successfully',
            products
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: `Webhook processing failed: ${error.message}`
        });
    }
});

export default router;
