import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Generate invoice for order
router.post('/generate', async (req, res) => {
    const { order_id } = req.body;
    
    try {
        // Get order details with items
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                retailers (
                    business_name,
                    address
                ),
                order_items (
                    quantity,
                    unit_price,
                    total_price,
                    products (
                        name,
                        sku
                    )
                )
            `)
            .eq('id', order_id)
            .single();

        if (orderError) throw orderError;

        // Here you would generate PDF invoice
        // For now, we'll just return the data needed for invoice
        res.json({
            invoice_data: {
                order_number: order.order_number,
                date: order.created_at,
                retailer: order.retailers,
                items: order.order_items,
                total_amount: order.total_amount
            }
        });
    } catch (error) {
        res.status(400).json({
            error: `Failed to generate invoice: ${error.message}`
        });
    }
});

export default router; 