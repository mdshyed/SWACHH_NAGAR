const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPasswordResetEmail = async ({ to, resetLink }) => {
  await transporter.sendMail({
    from: `"Swachh Nagar" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Reset your Swachh Nagar password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center;">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:40px;text-align:center;">
                        <span style="color:#fff;font-weight:800;font-size:14px;">SN</span>
                      </div>
                      <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;margin-left:8px;">Swachh Nagar</span>
                    </div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <div style="text-align:center;margin-bottom:28px;">
                      <div style="width:56px;height:56px;background:#f0fdf4;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                        <span style="font-size:28px;">🔐</span>
                      </div>
                      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
                      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                        We received a request to reset the password for your Swachh Nagar account. Click the button below to set a new password.
                      </p>
                    </div>

                    <div style="text-align:center;margin:28px 0;">
                      <a href="${resetLink}"
                         style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                        Reset Password →
                      </a>
                    </div>

                    <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0 0 8px;">
                      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                    </p>

                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;"/>

                    <p style="font-size:12px;color:#d1d5db;text-align:center;margin:0;">
                      Or copy this link into your browser:<br/>
                      <span style="color:#9ca3af;word-break:break-all;">${resetLink}</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © ${new Date().getFullYear()} Swachh Nagar · Smart City Cleanliness Management
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
