import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Set up pdfMake with default fonts
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// Next.js route handler
export async function POST(request) {
  try {
    // Get URL parameters from request
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();
    
    // Get data from request body
    const { manufacturerId } = await request.json();
    
    if (!orderId || !manufacturerId) {
      return NextResponse.json(
        { error: 'Order ID and Manufacturer ID are required' }, 
        { status: 400 }
      )
    }

    // Fetch order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('manufacturer_id', manufacturerId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      )
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity, 
        unit_price,
        total_price,
        products (name, sku)
      `)
      .eq('order_id', orderId)

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch order items' }, 
        { status: 500 }
      )
    }

    // Fetch retailer data
    const { data: retailer, error: retailerError } = await supabase
      .from('retailers')
      .select('*')
      .eq('id', order.retailer_id)
      .single()

    if (retailerError || !retailer) {
      return NextResponse.json(
        { error: 'Retailer not found' }, 
        { status: 404 }
      )
    }

    // Fetch manufacturer data
    const { data: manufacturer, error: manufacturerError } = await supabase
      .from('manufacturers')
      .select('*')
      .eq('id', manufacturerId)
      .single()

    if (manufacturerError || !manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' }, 
        { status: 404 }
      )
    }

    // Format date
    const orderDate = new Date(order.created_at).toLocaleDateString();
    const generatedDate = new Date().toLocaleString();

    // Create table body for items
    const tableBody = [
      ['Item #', 'Description', 'Quantity', 'Unit Price', 'Total'], // Header
    ];
    
    // Add item rows
    orderItems.forEach((item, index) => {
      tableBody.push([
        (index + 1).toString(),
        item.products?.name || 'Unknown Product',
        item.quantity.toString(),
        `$${item.unit_price.toFixed(2)}`,
        `$${item.total_price.toFixed(2)}`
      ]);
    });
    
    // Add total row
    tableBody.push(['', '', '', 'Subtotal:', `$${order.total_amount.toFixed(2)}`]);

    // Very simple PDF document definition
    const documentDefinition = {
      content: [
        { text: 'INVOICE', fontSize: 22, margin: [0, 0, 0, 10] },
        { text: `Order #: ${order.order_number || 'N/A'}`, margin: [0, 0, 0, 5] },
        { text: `Date: ${orderDate}`, margin: [0, 0, 0, 10] },
        
        { text: 'From:', fontSize: 14, margin: [0, 10, 0, 5] },
        { text: manufacturer.company_name || 'Your Company' },
        { text: manufacturer.address || 'Company Address' },
        { text: manufacturer.email || 'company@email.com', margin: [0, 0, 0, 10] },
        
        { text: 'Bill To:', fontSize: 14, margin: [0, 10, 0, 5] },
        { text: retailer.business_name || 'Client Name' },
        { text: retailer.address || 'Client Address' },
        { text: retailer.email || 'client@email.com', margin: [0, 0, 0, 10] },
        
        { text: 'Items:', fontSize: 14, margin: [0, 10, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto'],
            body: tableBody
          }
        },
        
        { text: 'Notes:', fontSize: 14, margin: [0, 10, 0, 5] },
        { text: manufacturer.invoice_template?.additional_notes || 'Terms and conditions, payment instructions, etc.' },
        
        { text: `Generated on ${generatedDate}`, fontSize: 8, alignment: 'right', margin: [0, 20, 0, 0] }
      ],
      defaultStyle: {
        fontSize: 10
      }
    };

    // Generate PDF
    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    
    return new Promise((resolve, reject) => {
      pdfDocGenerator.getBuffer((buffer) => {
        resolve(new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${order.order_number || orderId}.pdf"`,
            'Cache-Control': 'no-cache'
          }
        }));
      });
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate invoice',
        message: error.message
      },
      { status: 500 }
    );
  }
} 