const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"QuickBite" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}. MessageId: ${result.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Email send failed:', error);
        return false;
    }
};

// Send OTP email with professional template
const sendOtpEmail = async (email, otp, userName) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
                    padding: 30px;
                    text-align: center;
                    color: white;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 18px;
                    color: #333;
                    margin-bottom: 20px;
                }
                .otp-box {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border: 2px dashed #FF6B35;
                    border-radius: 8px;
                    padding: 25px;
                    text-align: center;
                    margin: 30px 0;
                }
                .otp-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .otp-code {
                    font-size: 36px;
                    font-weight: 900;
                    color: #FF6B35;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }
                .expiry-notice {
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .expiry-notice p {
                    margin: 0;
                    color: #856404;
                    font-size: 14px;
                }
                .security-warning {
                    background-color: #f8d7da;
                    border-left: 4px solid #dc3545;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .security-warning p {
                    margin: 0;
                    color: #721c24;
                    font-size: 14px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    border-top: 1px solid #dee2e6;
                }
                .footer p {
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍔 QuickBite</h1>
                </div>
                <div class="content">
                    <p class="greeting">Hello ${userName},</p>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        You requested a One-Time Password (OTP) to access your QuickBite account. 
                        Please use the code below to complete your authentication:
                    </p>
                    
                    <div class="otp-box">
                        <div class="otp-label">Your OTP Code</div>
                        <div class="otp-code">${otp}</div>
                    </div>

                    <div class="expiry-notice">
                        <p>⏰ <strong>Important:</strong> This OTP will expire in <strong>5 minutes</strong>. Please use it promptly.</p>
                    </div>

                    <div class="security-warning">
                        <p>🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. QuickBite will never ask for your OTP via phone or email.</p>
                    </div>

                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you didn't request this OTP, please ignore this email or contact our support team immediately.
                    </p>
                </div>
                <div class="footer">
                    <p><strong>QuickBite</strong> - Delicious Food, Delivered Fast</p>
                    <p>© ${new Date().getFullYear()} QuickBite. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Your QuickBite OTP Code 🔐',
        html: html
    });
};

module.exports = { sendEmail, sendOtpEmail };
