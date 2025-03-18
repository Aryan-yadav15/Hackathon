import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Send notification
router.post('/', async (req, res) => {
    const { order_id, type, message } = req.body;
    
    try {
        // Get order and retailer details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                retailers (
                    email,
                    business_name
                )
            `)
            .eq('id', order_id)
            .single();

        if (orderError) throw orderError;

        // Here you would integrate with your email service
        // For now, we'll just log the notification
        const { data, error } = await supabase
            .from('processing_logs')
            .insert([{
                order_id,
                log_type: 'notification',
                message: `Notification sent: ${type}`,
                details: {
                    notification_type: type,
                    message,
                    recipient: order.retailers.email
                }
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Notification sent successfully' });
    } catch (error) {
        res.status(400).json({
            error: `Failed to send notification: ${error.message}`
        });
    }
});

export default router; 