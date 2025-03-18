/**
 * Invoice Controller
 * Handles invoice-related operations including sending emails
 */

const { sendInvoiceEmail } = require('../src/services/emailService');

/**
 * Send invoice email to retailer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendInvoice = async (req, res) => {
  try {
    const { retailerId, orderId } = req.params;
    const { retailer, order, invoice } = req.body;
    
    // Validate request
    if (!retailer || !order || !invoice) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required data: retailer, order, and invoice details are required' 
      });
    }
    
    // Validate retailer email
    if (!retailer.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Retailer email is required' 
      });
    }
    
    // Send invoice email
    const result = await sendInvoiceEmail(retailer, order, invoice);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error in sendInvoice controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send invoice email',
      error: error.message
    });
  }
};

/**
 * Generate and send invoice for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateAndSendInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Here you would:
    // 1. Fetch order details from database
    // 2. Fetch retailer details
    // 3. Generate invoice data
    // 4. Send the invoice email
    // 5. Save the invoice to database
    
    // This is a placeholder for the actual implementation
    // that would integrate with your order processing system
    
    return res.status(200).json({
      success: true,
      message: 'Invoice generated and sent successfully',
      invoiceId: 'INV-' + Date.now() // Placeholder
    });
    
  } catch (error) {
    console.error('Error in generateAndSendInvoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate and send invoice',
      error: error.message
    });
  }
};

module.exports = {
  sendInvoice,
  generateAndSendInvoice
}; 