/**
 * Purchase Order Email Template Generator
 */

/**
 * Generate a beautiful HTML purchase order template
 * @param {Object} retailer - Retailer information
 * @param {Object} order - Order details
 * @param {Object} invoice - Invoice information
 * @param {string} manufacturerEmail - Manufacturer's email address
 * @returns {String} - HTML content for the email
 */
export const generateInvoiceTemplate = (retailer, order, invoice, manufacturerEmail = 'support@yourcompany.com') => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Generate table rows for order items
  const generateOrderItems = (items) => {
    return items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `).join('');
  };

  // Create HTML template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Purchase Order  #${invoice.invoiceNumber}</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #4a6cf7; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Purchase Order</h1>
          <p style="margin: 5px 0 0 0;">PO #${invoice.invoiceNumber}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h3 style="margin: 0 0 5px 0; color: #555;">Billed To:</h3>
              <p style="margin: 0; font-size: 15px;">${retailer.name}</p>
              <p style="margin: 0; font-size: 15px;">${retailer.address}</p>
              <p style="margin: 0; font-size: 15px;">${retailer.email}</p>
              ${retailer.phone ? `<p style="margin: 0; font-size: 15px;">${retailer.phone}</p>` : ''}
            </div>
            <div>
              <h3 style="margin: 0 0 5px 0; color: #555;">P/O Details:</h3>
              <p style="margin: 0; font-size: 15px;"><strong>Date:</strong> ${formatDate(invoice.date)}</p>
              <p style="margin: 0; font-size: 15px;"><strong>P/O ID:</strong> ${order.orderId}</p>
              <p style="margin: 0; font-size: 15px;"><strong>Payment Status:</strong> <span style="color: ${invoice.paid ? '#4CAF50' : '#F44336'};">${invoice.paid ? 'Paid' : 'Pending'}</span></p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Unit Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItems(order.items)}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 12px; text-align: right;">${formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Tax (${invoice.taxRate}%):</td>
                <td style="padding: 12px; text-align: right;">${formatCurrency(invoice.tax)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #4a6cf7;">${formatCurrency(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #555;">COnfirmation required:</h3>
            <p style="margin: 0 0 5px 0; font-size: 15px;">Incase of any mismissing products or mails us at ${manufacturerEmail} </p>
            <p style="margin: 0; font-size: 15px;">or the order will be processed in 2 days</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">
            <p style="margin: 0;">Thank you for your business!</p>
            <p style="margin: 5px 0 0 0;">For any questions, please contact ${manufacturerEmail}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}; 