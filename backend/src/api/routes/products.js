import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Add new product
router.post('/', async (req, res) => {
    const { manufacturer_id, name, sku, price } = req.body;
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([
                { manufacturer_id, name, sku, price }
            ])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get manufacturer's products
router.get('/manufacturer/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('manufacturer_id', req.params.id)
            .order('name');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router; 