import supabase from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export async function createOrder(parsedData) {
    const { emailMetadata, orderDetails } = parsedData;

    // Extract retailer email and manufacturer email
    const retailerEmail = emailMetadata.from;
    const manufacturerEmail = emailMetadata.to;

    // First find the manufacturer by email
    const { data: manufacturerData, error: manufacturerError } = await supabase
        .from('manufacturers')
        .select('id')
        .eq('email', manufacturerEmail)
        .single();

    if (manufacturerError) {
        throw new Error(`Manufacturer not found: ${manufacturerError.message}`);
    }

    const manufacturerId = manufacturerData.id;

    // Find the retailer by email and manufacturer_id
    const { data: retailerData, error: retailerError } = await supabase
        .from('retailers')
        .select('id, manufacturer_id')
        .ilike('email', retailerEmail.trim())
        .eq('manufacturer_id', manufacturerId)
        .single();

    if (retailerError) {
        throw new Error(`Retailer not found: ${retailerError.message}`);
    }

    const retailerId = retailerData.id;

    // Create a new order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Calculate product count and parse quantities
    let totalAmount = 0;
    const itemsForInsert = [];

    // Process product items
    for (const [productName, quantityStr] of Object.entries(orderDetails.products)) {
        // Extract numeric quantity
        const quantity = parseInt(quantityStr.replace(/[^0-9]/g, ''));

        // Find product with a more flexible query
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, price, name')
            .ilike('name', productName.trim()) // Case-insensitive search
            .eq('manufacturer_id', manufacturerId);

        // If exact match fails, log and continue
        if (productError || !productData || productData.length === 0) {
            console.log(`Debug - Product not found: "${productName}" - Manufacturer ID: ${manufacturerId}`);
            continue; // Skip this product instead of failing the whole order
        }

        // Use the first matching product
        const productId = productData[0].id;
        const price = productData[0].price;
        console.log(`Debug - Product matched: "${productData[0].name}" (ID: ${productId})`);

        // Add to order items
        itemsForInsert.push({
            product_id: productId,
            quantity,
            unit_price: price,
            total_price: quantity * price
        });

        totalAmount += quantity * price;
    }

    // Insert order with special request flag and email body
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            retailer_id: retailerId,
            manufacturer_id: manufacturerId,
            processing_status: 'pending',
            total_amount: totalAmount,
            has_special_request: orderDetails.specialRequest || false,
            special_request_confidence: orderDetails.specialRequestConfidence || 0,
            parser_flag: orderDetails.parserFlag || 0,
            special_request_details: orderDetails.specialRequest ? "Special request from customer" : null,
            email_body: JSON.stringify(parsedData),
            email_subject: emailMetadata.subject,
            email_parsed_data: parsedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Only insert order items if we have any
    if (itemsForInsert.length > 0) {
        // Insert order items
        const orderItems = itemsForInsert.map(item => ({
            ...item,
            order_id: orderData.id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            throw new Error(`Failed to create order items: ${itemsError.message}`);
        }
    }

    return {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        itemsCount: itemsForInsert.length,
        totalAmount: totalAmount,
        hasSpecialRequest: orderDetails.specialRequest || false
    };
} 