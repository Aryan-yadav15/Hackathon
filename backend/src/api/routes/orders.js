import express from 'express';
import supabase from '../../db/index.js';
import { z } from 'zod';
import { sendInvoiceEmail } from '../../services/emailService.js';

const router = express.Router();

// Validation schemas
const orderProductSchema = z.object({
  sku: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().optional(),
  description: z.string().optional()
});

const orderSchema = z.object({
  retailer_email: z.string().email(),
  manufacturer_email: z.string().email(),
  order_number: z.string(),
  order_date: z.string().datetime(),
  products: z.array(orderProductSchema),
  po_document_url: z.string().url().optional(),
  additional_notes: z.string().optional()
});

// Create new order
router.post('/', async (req, res) => {
  try {
    console.log('➡️ Received POST to /api/orders');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { emailMetadata, orderDetails } = req.body;
    
    if (!emailMetadata || !orderDetails) {
      console.error('❌ Missing required data:', { emailMetadata, orderDetails });
      return res.status(400).json({
        error: 'Invalid request structure - missing emailMetadata or orderDetails'
      });
    }

    console.log('📧 Email metadata:', emailMetadata);
    console.log('📦 Order details:', orderDetails);

    // Manufacturer lookup
    console.log(`🔍 Looking up manufacturer with email: ${emailMetadata.to}`);
    const { data: manufacturer, error: mError } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('email', emailMetadata.to)
      .single();

    console.log('Manufacturer lookup result:', { manufacturer, mError });
    if (mError || !manufacturer) {
      console.error('❌ Manufacturer lookup failed:', mError || 'Not found');
      return res.status(400).json({
        error: `Manufacturer lookup failed: ${mError?.message || 'Not found'}`
      });
    }

    // Retailer lookup - now includes manufacturer_id
    console.log(`🔍 Looking up retailer with email: ${emailMetadata.from} and manufacturer ID: ${manufacturer.id}`);
    const { data: retailer, error: rError } = await supabase
      .from('retailers')
      .select('id')
      .ilike('email', emailMetadata.from.trim())
      .eq('manufacturer_id', manufacturer.id)
      .single();

    console.log('Retailer lookup result:', { retailer, rError });
    if (rError || !retailer) {
      throw new Error(`Retailer lookup failed: ${rError?.message || 'Not found'}`);
    }

    // Add this after retailer lookup
    const { data: groupMemberships } = await supabase
      .from('retailer_group_members')
      .select('groups(id, name, rules)')
      .eq('retailer_id', retailer.id);

    const groupRules = {
      regions: [],
      tiers: [],
      volume: []
    };

    groupMemberships.forEach(membership => {
      const group = membership.groups;
      if (group.name.startsWith('region-')) {
        groupRules.regions.push(group.rules);
      } else if (group.name.startsWith('tier-')) {
        groupRules.tiers.push(group.rules);
      } else if (group.name.startsWith('volume-')) {
        groupRules.volume.push(group.rules);
      }
    });

    // Apply group rules to order processing
    if (groupRules.regions.length > 0) {
      applyRegionalPricing(orderDetails, groupRules.regions);
    }

    if (groupRules.tiers.length > 0) {
      applyTierDiscounts(orderDetails, groupRules.tiers);
    }

    if (groupRules.volume.length > 0) {
      applyVolumeBonuses(orderDetails, groupRules.volume);
    }

    // When processing orders, check retailer group membership
    const { data: groupMembership } = await supabase
      .from('retailer_group_members')
      .select('group_id')
      .eq('retailer_id', retailer.id);

    // Then determine processing path based on group IDs

    // Create order
    console.log('🛒 Creating order...');
    const orderPayload = {
      manufacturer_id: manufacturer.id,
      retailer_id: retailer.id,
      order_number: `ORD-${Date.now()}`,
      email_subject: emailMetadata.subject,
      email_body: JSON.stringify(req.body),
      email_received_at: new Date(emailMetadata.timestamp),
      processing_status: 'pending',
      email_parsed_data: req.body,
      has_special_request: orderDetails.specialRequest || false,
      special_request_confidence: orderDetails.specialRequestConfidence || 0,
      parser_flag: orderDetails.products && orderDetails.products.flag ? orderDetails.products.flag : 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Order payload:', orderPayload);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    console.log('Order creation result:', { order, orderError });
    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    // Create order items
    console.log('📦 Creating order items...');
    const orderItems = Object.entries(orderDetails.products).map(([productName, quantity]) => {
      const qty = parseInt(quantity.replace(/\D/g, ''));
      if (isNaN(qty)) {
        console.warn(`⚠️ Invalid quantity for ${productName}: ${quantity}`);
        return null;
      }
      
      return {
        order_id: order.id,
        product_name: productName,
        quantity: qty,
        created_at: new Date()
      };
    }).filter(Boolean);

    console.log('Order items payload:', orderItems);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Order items error:', itemsError);
      throw new Error(`Partial failure: Order created but items failed (${itemsError.message})`);
    }

    // Send invoice email to retailer
    try {
      // Get more detailed retailer info for the invoice
      const { data: retailerDetails, error: retailerDetailsError } = await supabase
        .from('retailers')
        .select('*')
        .eq('id', retailer.id)
        .single();
        
      if (retailerDetailsError) {
        console.error('Error fetching retailer details for invoice:', retailerDetailsError);
        throw new Error(`Failed to fetch retailer details for invoice: ${retailerDetailsError.message}`);
      }
      
      // Format retailer data for invoice
      const retailerForInvoice = {
        name: retailerDetails.business_name || retailerDetails.name || 'Valued Customer',
        email: retailerDetails.email,
        address: retailerDetails.address || 'Address not provided',
        phone: retailerDetails.phone || ''
      };
      
      // Calculate totals for invoice
      let subtotal = 0;
      const orderItemsWithProducts = [];
      
      for (const item of orderItems) {
        const unitPrice = 0; // We would need to fetch this from products table
        const quantity = item.quantity;
        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;
        
        orderItemsWithProducts.push({
          name: item.product_name,
          quantity: quantity,
          price: unitPrice
        });
      }
      
      const taxRate = 10;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;
      
      // Format order data for invoice
      const orderForInvoice = {
        orderId: order.order_number,
        orderDate: new Date().toISOString(),
        items: orderItemsWithProducts
      };
      
      // Create invoice data
      const invoiceData = {
        invoiceNumber: `INV-${order.order_number.replace('ORD-', '')}`,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due in 30 days
        subtotal,
        taxRate,
        tax,
        total,
        paid: false,
        paymentTerms: 30
      };
      
      // Send invoice email
      await sendInvoiceEmail(retailerForInvoice, orderForInvoice, invoiceData);
      console.log('📧 Invoice email sent successfully to retailer:', retailerForInvoice.email);
    } catch (invoiceError) {
      console.error('❌ Error sending invoice email:', invoiceError);
      // Don't fail the order creation if email sending fails
    }

    console.log('✅ Order processed successfully');
    return res.status(200).json({
      success: true,
      orderId: order.id,
      itemsCount: orderItems.length,
      invoiceSent: true
    });

  } catch (error) {
    console.error('‼️ Critical error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  const { processing_status, validation_errors } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        processing_status,
        validation_errors,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select(`
        id,
        order_number,
        processing_status,
        validation_errors
      `)
      .single();

    if (error) throw error;
    
    // If status is invalid, trigger error logging
    if (processing_status === 'invalid') {
      await supabase
        .from('processing_logs')
        .insert([{
          order_id: req.params.id,
          log_type: 'validation',
          message: 'Invalid order detected',
          details: validation_errors
        }]);
    }

    res.json(data);
  } catch (error) {
    res.status(400).json({ 
      error: `Status update failed: ${error.message}` 
    });
  }
});

// Get orders by manufacturer with filters
router.get('/manufacturer/:id', async (req, res) => {
  const { status, start_date, end_date } = req.query;
  
  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email_subject,
        processing_status,
        created_at,
        retailers!inner(business_name)
      `)
      .eq('manufacturer_id', req.params.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('processing_status', status);
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
      error: `Failed to fetch orders: ${error.message}` 
    });
  }
});

// GET single order with details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        retailers (id, business_name, email),
        order_items (
          id, 
          quantity, 
          unit_price, 
          total_price,
          products (id, name, sku)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 