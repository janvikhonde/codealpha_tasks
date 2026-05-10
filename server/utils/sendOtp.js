const nodemailer = require('nodemailer');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Nexus PM" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Nexus PM Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #1a1a2e; border-radius: 12px; color: #ffffff;">
        <h2 style="color: #6c63ff; margin-bottom: 8px;">Nexus PM</h2>
        <h3 style="margin-bottom: 24px;">Verify your email address</h3>
        <p style="color: #aaa; margin-bottom: 24px;">Use the code below to complete your registration. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
        <div style="background: #6c63ff; border-radius: 8px; padding: 20px; text-align: center; letter-spacing: 8px; font-size: 32px; font-weight: bold;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendInviteEmail = async (toEmail, inviterName, projectName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Nexus PM" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `You've been invited to ${projectName} on Nexus PM`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #1a1a2e; border-radius: 12px; color: #ffffff;">
        <h2 style="color: #6c63ff; margin-bottom: 8px;">Nexus PM</h2>
        <h3 style="margin-bottom: 24px;">You've been invited!</h3>
        <p style="color: #aaa; margin-bottom: 24px;">
          <strong style="color: #fff;">${inviterName}</strong> has invited you to join the project 
          <strong style="color: #6c63ff;">${projectName}</strong> on Nexus PM.
        </p>
        <a href="${process.env.CLIENT_URL}/register" 
           style="display: inline-block; background: #6c63ff; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Accept Invitation
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          If you already have an account, sign in and you'll see the project in your sidebar.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOtpEmail, sendInviteEmail};