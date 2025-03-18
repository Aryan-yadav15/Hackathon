import express from 'express';
import supabase from '../../db/index.js';

const router = express.Router();

// Add items to order
router.post('/', async (req, res) => {
    const { order_id, product_id, quantity, unit_price } = req.body;
    
    try {
        // Calculate total price
        const total_price = quantity * unit_price;

        // Insert order item
        const { data, error } = await supabase
            .from('order_items')
            .insert([{
                order_id,
                product_id,
                quantity,
                unit_price,
                total_price
            }])
            .select(`
                id,
                quantity,
                unit_price,
                total_price,
                products (
                    name,
                    sku
                )
            `)
            .single();

        if (error) throw error;

        // Update order total amount
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('id', order_id)
            .single();

        if (orderError) throw orderError;

        const newTotal = (orderData.total_amount || 0) + total_price;

        await supabase
            .from('orders')
            .update({ total_amount: newTotal })
            .eq('id', order_id);

        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to add order item: ${error.message}`
        });
    }
});

// Get items for an order
router.get('/order/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                id,
                quantity,
                unit_price,
                total_price,
                products (
                    id,
                    name,
                    sku,
                    price
                )
            `)
            .eq('order_id', req.params.id);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to fetch order items: ${error.message}`
        });
    }
});

// Update order item quantity
router.patch('/:id/quantity', async (req, res) => {
    const { quantity } = req.body;
    
    try {
        // Get current item details
        const { data: currentItem, error: fetchError } = await supabase
            .from('order_items')
            .select('unit_price, order_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        const new_total_price = quantity * currentItem.unit_price;

        // Update item
        const { data, error } = await supabase
            .from('order_items')
            .update({
                quantity,
                total_price: new_total_price
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Recalculate order total
        const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('total_price')
            .eq('order_id', currentItem.order_id);

        if (itemsError) throw itemsError;

        const orderTotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);

        await supabase
            .from('orders')
            .update({ total_amount: orderTotal })
            .eq('id', currentItem.order_id);

        res.json(data);
    } catch (error) {
        res.status(400).json({
            error: `Failed to update quantity: ${error.message}`
        });
    }
});

// Delete order item
router.delete('/:id', async (req, res) => {
    try {
        // Get item details before deletion
        const { data: item, error: fetchError } = await supabase
            .from('order_items')
            .select('order_id, total_price')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        // Delete the item
        const { error: deleteError } = await supabase
            .from('order_items')
            .delete()
            .eq('id', req.params.id);

        if (deleteError) throw deleteError;

        // Update order total
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('id', item.order_id)
            .single();

        if (orderError) throw orderError;

        const newTotal = orderData.total_amount - item.total_price;

        await supabase
            .from('orders')
            .update({ total_amount: newTotal })
            .eq('id', item.order_id);

        res.json({ message: 'Order item deleted successfully' });
    } catch (error) {
        res.status(400).json({
            error: `Failed to delete order item: ${error.message}`
        });
    }
});

export default router; 