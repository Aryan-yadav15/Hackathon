/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';
import emailConfig from '../config/emailConfig.js';
import { generateInvoiceTemplate } from '../templates/invoiceTemplate.js';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport(emailConfig);

// Log email configuration (without password)
console.log('Email configuration loaded:', {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user,
  from: emailConfig.from
});

/**
 * Send invoice email to retailer
 * @param {Object} retailer - Retailer information including email
 * @param {Object} order - Order details
 * @param {Object} invoice - Invoice information
 * @param {string} manufacturerEmail - Manufacturer's email address
 * @returns {Promise} - Promise resolving to info about sent email
 */
export const sendInvoiceEmail = async (retailer, order, invoice, manufacturerEmail = 'support@yourcompany.com') => {
  try {
    console.log('Generating email content for recipient:', retailer.email);
    
    // Generate HTML content for invoice
    const htmlContent = generateInvoiceTemplate(retailer, order, invoice, manufacturerEmail);
    
    // Setup email data
    const mailOptions = {
      from: emailConfig.from,
      to: retailer.email,
      subject: `Purchase Order #${invoice.invoiceNumber} Confirmation`,
      html: htmlContent
    };
    
    console.log('Sending email with subject:', mailOptions.subject);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

/**
 * Verify email configuration is working
 * @returns {Promise} - Promise resolving to verify result
 */
export const verifyEmailConfig = async () => {
  try {
    console.log('Verifying email configuration...');
    const result = await transporter.verify();
    console.log('Email configuration is valid and connection is working');
    return { success: true, message: 'Email configuration verified' };
  } catch (error) {
    console.error('Email configuration error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}; 