// src/services/email/index.js
const nodemailer = require('nodemailer');
const { AppError } = require('../../middleware/error');

/**
 * Configure email transport based on environment
 * - Uses Ethereal (fake SMTP service) for development
 * - Uses configured SMTP service for production
 */
const createTransport = async () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Object} - Email send info
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransport();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new AppError('Failed to send email', 500);
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Reset URL with token
 * @returns {Object} - Email send info
 */
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const subject = 'Your password reset token (valid for 10 minutes)';
  
  const text = `
    Hi ${username},
    
    You requested a password reset for your ESports Betting account.
    
    Please use the following link to reset your password:
    ${resetUrl}
    
    If you didn't request this, please ignore this email and your password will remain unchanged.
    
    The link will expire in 10 minutes.
    
    Regards,
    ESports Betting Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hi ${username},</p>
      <p>You requested a password reset for your ESports Betting account.</p>
      <p>Click the button below to reset your password (valid for 10 minutes):</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 20px; margin: 8px 0; border: none; border-radius: 4px; cursor: pointer; text-decoration: none;">
          Reset Password
        </a>
      </p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <p>Regards,<br>ESports Betting Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
};