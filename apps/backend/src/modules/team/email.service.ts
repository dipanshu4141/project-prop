import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,   // Google App Password, not your real password
    },
  });

  /* ================================================================
   * WORKSPACE INVITE
   * ================================================================ */

  async sendWorkspaceInvite(opts: {
    to:            string;
    invitedBy:     string;
    workspaceName: string;
    role:          string;
    inviteUrl:     string;   // http://localhost:3001/invites/accept?token=xxx
  }) {
    const subject = `${opts.invitedBy} invited you to join ${opts.workspaceName} on Property CRM`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#F7F5F0;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

          <!-- Header -->
          <div style="background:#0B1F14;padding:28px 32px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:28px;height:28px;background:#10B981;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-size:14px;">🏠</span>
              </div>
              <span style="color:white;font-size:16px;font-weight:600;">Property CRM</span>
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">You've been invited</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              <strong style="color:#0f172a;">${opts.invitedBy}</strong> has invited you to join
              <strong style="color:#0f172a;">${opts.workspaceName}</strong> as a
              <strong style="color:#0f172a;">${opts.role.toLowerCase()}</strong>.
            </p>

            <a href="${opts.inviteUrl}"
               style="display:inline-block;background:#0B1F14;color:white;text-decoration:none;
                      padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">
              Accept invitation →
            </a>

            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
              This link expires in 7 days. If you didn't expect this invite, you can safely ignore it.
            </p>

            <!-- Dev helper — remove in production -->
            <div style="margin-top:24px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                🛠 Dev mode — invite link:<br/>
                <a href="${opts.inviteUrl}" style="color:#0B1F14;word-break:break-all;">${opts.inviteUrl}</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:20px 32px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">Property CRM · Sent from localhost</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from:    `"Property CRM" <${process.env.GMAIL_USER}>`,
        to:      opts.to,
        subject,
        html,
      });

      // Always log the invite URL — useful in dev even if email arrives
      this.logger.log(`✉️  Invite sent to ${opts.to}`);
      this.logger.log(`🔗 Invite URL: ${opts.inviteUrl}`);

      return { sent: true, messageId: info.messageId };
    } catch (err) {
      // Don't crash the request if email fails — log and continue
      this.logger.error(`Failed to send invite email to ${opts.to}`, err);
      this.logger.log(`🔗 Invite URL (email failed): ${opts.inviteUrl}`);
      return { sent: false };
    }
  }
}