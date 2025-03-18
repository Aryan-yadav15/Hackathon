import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Create processing log
router.post('/', async (req, res) => {
    const { manufacturer_id, order_id, log_type, message, details } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('processing_logs')
            .insert([{
                manufacturer_id,
                order_id,
                log_type,
                message,
                details
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to create log: ${error.message}`
        });
    }
});

// Get logs for an order
router.get('/order/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('processing_logs')
            .select('*')
            .eq('order_id', req.params.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to fetch logs: ${error.message}`
        });
    }
});

// Get logs by manufacturer
router.get('/manufacturer/:id', async (req, res) => {
    const { type, start_date, end_date } = req.query;
    
    try {
        let query = supabase
            .from('processing_logs')
            .select(`
                *,
                orders (
                    order_number,
                    email_subject
                )
            `)
            .eq('manufacturer_id', req.params.id)
            .order('created_at', { ascending: false });

        if (type) query = query.eq('log_type', type);
        if (start_date && end_date) {
            query = query
                .gte('created_at', start_date)
                .lte('created_at', end_date);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to fetch logs: ${error.message}`
        });
    }
});

export default router; 