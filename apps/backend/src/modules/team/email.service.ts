// apps/backend/src/modules/team/email.service.ts
//
// Drop-in replacement for the nodemailer/Gmail version.
// Same public interface — no changes needed in team.service.ts.
//
// Setup:
//   1. npm install resend          (in apps/backend)
//   2. Add to backend .env:
//        RESEND_API_KEY=re_xxxxxxxxxxxx
//        EMAIL_FROM=GrowCliento <noreply@yourdomain.com>
//        FRONTEND_URL=http://localhost:3001   (already exists)
//   3. In Resend dashboard: verify your sending domain.
//      During dev you can use onboarding@resend.dev as FROM
//      (delivers only to your own verified email address).

import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from   = process.env.EMAIL_FROM ?? 'GrowCliento <onboarding@resend.dev>';

  /* ================================================================
   * WORKSPACE INVITE
   * Called by team.service.ts → sendInvite() and resendInvite()
   * ================================================================ */

  async sendWorkspaceInvite(opts: {
    to:            string;
    invitedBy:     string;
    workspaceName: string;
    role:          string;
    inviteUrl:     string;
  }) {
    const subject = `${opts.invitedBy} invited you to join ${opts.workspaceName} on GrowCliento`;

    const html = this.inviteHtml(opts);

    try {
      const { data, error } = await this.resend.emails.send({
        from:    this.from,
        to:      opts.to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend error for invite to ${opts.to}: ${JSON.stringify(error)}`);
        this.logger.log(`🔗 Invite URL (email failed): ${opts.inviteUrl}`);
        return { sent: false };
      }

      this.logger.log(`✉️  Invite sent to ${opts.to} — Resend id: ${data?.id}`);
      this.logger.log(`🔗 Invite URL: ${opts.inviteUrl}`);
      return { sent: true, messageId: data?.id };

    } catch (err) {
      this.logger.error(`Failed to send invite email to ${opts.to}`, err);
      this.logger.log(`🔗 Invite URL (email failed): ${opts.inviteUrl}`);
      return { sent: false };
    }
  }

  /* ================================================================
   * WELCOME EMAIL
   * Call this after a user registers via invite and joins workspace.
   * Wire it in team.service.ts → acceptInvite() if desired.
   * ================================================================ */

  async sendWelcome(opts: {
    to:            string;
    name:          string;
    workspaceName: string;
    dashboardUrl:  string;
  }) {
    const subject = `Welcome to ${opts.workspaceName} on GrowCliento`;

    const html = this.welcomeHtml(opts);

    try {
      const { data, error } = await this.resend.emails.send({
        from:    this.from,
        to:      opts.to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend error for welcome to ${opts.to}: ${JSON.stringify(error)}`);
        return { sent: false };
      }

      this.logger.log(`✉️  Welcome sent to ${opts.to} — Resend id: ${data?.id}`);
      return { sent: true, messageId: data?.id };

    } catch (err) {
      this.logger.error(`Failed to send welcome email to ${opts.to}`, err);
      return { sent: false };
    }
  }

  /* ================================================================
   * HTML TEMPLATES
   * ================================================================ */

  private inviteHtml(opts: {
    invitedBy: string; workspaceName: string; role: string; inviteUrl: string;
  }) {
    const roleLabel = opts.role.charAt(0) + opts.role.slice(1).toLowerCase();
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

    <div style="background:#0B1F14;padding:28px 32px;">
      <span style="color:white;font-size:18px;font-weight:700;letter-spacing:-0.3px;">GrowCliento</span>
    </div>

    <div style="padding:36px 32px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;font-weight:700;">You're invited</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.65;">
        <strong style="color:#0f172a;">${opts.invitedBy}</strong> has invited you to join
        <strong style="color:#0f172a;">${opts.workspaceName}</strong> as a
        <strong style="color:#0f172a;">${roleLabel}</strong>.
      </p>

      <a href="${opts.inviteUrl}"
         style="display:inline-block;background:#10B981;color:white;text-decoration:none;
                padding:13px 30px;border-radius:10px;font-weight:600;font-size:15px;">
        Accept invitation →
      </a>

      <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
        This link expires in 7 days. If you weren't expecting this, you can safely ignore it.
      </p>
    </div>

    <div style="padding:18px 32px;border-top:1px solid #f1f5f9;background:#fafafa;">
      <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
        GrowCliento · Real estate CRM for Indian brokers
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private welcomeHtml(opts: {
    name: string; workspaceName: string; dashboardUrl: string;
  }) {
    const firstName = opts.name?.split(' ')[0] || 'there';
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

    <div style="background:#0B1F14;padding:28px 32px;">
      <span style="color:white;font-size:18px;font-weight:700;letter-spacing:-0.3px;">GrowCliento</span>
    </div>

    <div style="padding:36px 32px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;font-weight:700;">Welcome, ${firstName}! 🎉</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.65;">
        You've joined <strong style="color:#0f172a;">${opts.workspaceName}</strong> on GrowCliento.
        Your dashboard is ready — start adding clients and listings.
      </p>

      <a href="${opts.dashboardUrl}"
         style="display:inline-block;background:#10B981;color:white;text-decoration:none;
                padding:13px 30px;border-radius:10px;font-weight:600;font-size:15px;">
        Go to dashboard →
      </a>
    </div>

    <div style="padding:18px 32px;border-top:1px solid #f1f5f9;background:#fafafa;">
      <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
        GrowCliento · Real estate CRM for Indian brokers
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}