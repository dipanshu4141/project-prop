import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from   = process.env.RESEND_FROM ?? 'noreply@growcliento.com';
  private readonly appUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';

  async sendVerificationEmail(email: string, name: string | null, token: string) {
    const link = `${this.appUrl}/verify-email?token=${token}`;
    await this.resend.emails.send({
      from:    this.from,
      to:      email,
      subject: 'Verify your PropertyAI email',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#0B1F14;margin-bottom:8px">Verify your email</h2>
          <p style="color:#6b7280;margin-bottom:24px">
            Hi ${name ?? 'there'}, click the button below to verify your email address.
            This link expires in 24 hours.
          </p>
          <a href="${link}" style="display:inline-block;background:#0B1F14;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Verify email
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Or copy this link: ${link}
          </p>
        </div>
      `,
    }).catch(err => this.logger.error('sendVerificationEmail failed:', err));
  }

  async sendPasswordResetEmail(email: string, name: string | null, token: string) {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    await this.resend.emails.send({
      from:    this.from,
      to:      email,
      subject: 'Reset your PropertyAI password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#0B1F14;margin-bottom:8px">Reset your password</h2>
          <p style="color:#6b7280;margin-bottom:24px">
            Hi ${name ?? 'there'}, click below to reset your password. This link expires in 1 hour.
          </p>
          <a href="${link}" style="display:inline-block;background:#0B1F14;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Reset password
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    }).catch(err => this.logger.error('sendPasswordResetEmail failed:', err));
  }
}