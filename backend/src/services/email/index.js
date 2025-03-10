// src/services/email/index.js - Updated
const nodemailer = require('nodemailer');
const { AppError } = require('../../middleware/error');

/**
 * Configure email transport for Mailgun
 */
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    // Added for better debugging
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  });
};

/**
 * Send email with better error handling
 * @param {Object} options - Email options
 * @returns {Object} - Email send info
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransport();
    
    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP Connection Verification Error:', verifyError);
      throw new AppError('Email service connection error: ' + verifyError.message, 500);
    }
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    console.log(`Attempting to send email to: ${options.to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // For development, log preview URL (if available)
    if (process.env.NODE_ENV === 'development' && info.preview) {
      console.log('Email Preview URL:', info.preview);
    }
    
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // More specific error messages based on common issues
    if (error.code === 'EENVELOPE' && error.responseCode === 421) {
      throw new AppError('Mailgun account not activated. Please check your Mailgun account and activate it.', 500);
    } else if (error.code === 'EAUTH') {
      throw new AppError('Email authentication failed. Check your SMTP credentials.', 500);
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      throw new AppError('Could not connect to the email server. Check your network and email configuration.', 500);
    }
    
    throw new AppError('Failed to send email: ' + error.message, 500);
  }
};

/**
 * Send password reset email
 * Same implementation as before, just calls the updated sendEmail function
 */
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

  
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