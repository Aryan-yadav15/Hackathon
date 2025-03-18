import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Check for duplicate order
router.get('/duplicate-order', async (req, res) => {
    const { manufacturer_id, email_subject } = req.query;
    
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('manufacturer_id', manufacturer_id)
            .eq('email_subject', email_subject)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        res.json({
            isDuplicate: !!data,
            existingOrder: data
        });
    } catch (error) {
        res.status(400).json({
            error: `Duplicate check failed: ${error.message}`
        });
    }
});

// Validate product stock
router.post('/stock', async (req, res) => {
    const { items } = req.body;
    
    try {
        const validationResults = [];
        
        for (const item of items) {
            const { data: product, error } = await supabase
                .from('products')
                .select('id, name, sku')
                .eq('sku', item.sku)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            validationResults.push({
                sku: item.sku,
                isValid: !!product,
                product: product
            });
        }

        res.json(validationResults);
    } catch (error) {
        res.status(400).json({
            error: `Stock validation failed: ${error.message}`
        });
    }
});

export default router; 