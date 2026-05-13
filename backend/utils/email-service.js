// utils/email-service.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};


// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        // Create reset URL - adjust this based on your frontend URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('--- MOCK EMAIL (No credentials provided) ---');
            console.log(`To: ${email}`);
            console.log(`Subject: Password Reset Request - Trakory`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log('-------------------------------------------');
            return { success: true, messageId: 'mock-id-no-credentials' };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: {
                name: 'Trakory Team',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Password Reset Request - Trakory',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                            font-weight: 600;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .content h2 {
                            color: #333;
                            margin-top: 0;
                            font-size: 20px;
                        }
                        .button {
                            display: inline-block;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 14px 30px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: 600;
                            margin: 20px 0;
                            transition: transform 0.2s;
                        }
                        .button:hover {
                            transform: translateY(-1px);
                        }
                        .warning {
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            border-radius: 4px;
                            padding: 15px;
                            margin: 20px 0;
                            color: #856404;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px 30px;
                            text-align: center;
                            color: #666;
                            font-size: 14px;
                        }
                        .security-note {
                            background: #e3f2fd;
                            border-left: 4px solid #2196f3;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 0 4px 4px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Trakory</h1>
                        </div>
                        
                        <div class="content">
                            <h2>Password Reset Request</h2>
                            
                            <p>Hello ${userName || 'User'},</p>
                            
                            <p>We received a request to reset your password for your Trakory account. If you didn't make this request, you can ignore this email.</p>
                            
                            <p>To reset your password, click the button below:</p>
                            
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset My Password</a>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                            </div>
                            
                            <div class="security-note">
                                <strong>🛡️ Security Note:</strong> If you didn't request this password reset, please check your account security and consider changing your password immediately.
                            </div>
                            
                            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #667eea; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                                ${resetUrl}
                            </p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2024 Trakory. All rights reserved.</p>
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            // Fallback text version
            text: `
                Password Reset Request - Trakory
                
                Hello ${userName || 'User'},
                
                We received a request to reset your password for your Trakory account.
                
                To reset your password, please visit: ${resetUrl}
                
                This link will expire in 1 hour for security reasons.
                
                If you didn't request this password reset, please ignore this email.
                
                Best regards,
                The Trakory Team
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, userName) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('--- MOCK EMAIL (No credentials provided) ---');
            console.log(`To: ${email}`);
            console.log(`Subject: Welcome to Trakory!`);
            console.log('-------------------------------------------');
            return { success: true, messageId: 'mock-id-no-credentials' };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: {
                name: 'Trakory Team',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Welcome to Trakory!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                        <h1>Welcome to Trakory!</h1>
                    </div>
                    <div style="padding: 30px;">
                        <h2>Hello ${userName}!</h2>
                        <p>Welcome to Trakory - your comprehensive project management and time tracking solution.</p>
                        <p>You can now start:</p>
                        <ul>
                            <li>Tracking your time and attendance</li>
                            <li>Managing projects and collaborating with your team</li>
                            <li>Using our chat and communication features</li>
                            <li>Organizing files with our drive integration</li>
                        </ul>
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                        <p>Best regards,<br>The Trakory Team</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail
};
