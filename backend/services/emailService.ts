import nodemailer from 'nodemailer';
import { logError } from '../controllers/utils/errorHandlers';

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'DevLink'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
        to,
        subject: 'Password Reset Request',
        html: `
          <h1>Hello ${name},</h1>
          <p>You have requested to reset your password.</p>
          <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p>Best regards,<br>DevLink Team</p>
        `,
      });
      
      return true;
    } catch (error) {
      logError(error, 'Failed to send password reset email', { recipient: to });
      return false;
    }
  }

  public async sendPasswordChangedEmail(
    to: string,
    name: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'DevLink'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
        to,
        subject: 'Password Changed Successfully',
        html: `
          <h1>Hello ${name},</h1>
          <p>Your password has been successfully changed.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>DevLink Team</p>
        `,
      });
      
      return true;
    } catch (error) {
      logError(error, 'Failed to send password changed email', { recipient: to });
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();  