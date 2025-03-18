/**
 * Email Configuration
 * Contains settings for email service
 */

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },
  from: process.env.EMAIL_FROM || 'Your Company <your-email@gmail.com>'
};

export default emailConfig; 