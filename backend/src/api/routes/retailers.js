import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Add new retailer
router.post('/', async (req, res) => {
    const { manufacturer_id, business_name, contact_name, email, address, phone } = req.body;
    try {
        const { data, error } = await supabase
            .from('retailers')
            .insert([
                { manufacturer_id, business_name, contact_name, email, address, phone }
            ])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get retailer by email (for validation)
router.get('/by-email', async (req, res) => {
    const { manufacturer_id, email } = req.query;
    try {
        const { data, error } = await supabase
            .from('retailers')
            .select('*')
            .eq('manufacturer_id', manufacturer_id)
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router; 