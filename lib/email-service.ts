import { Resend } from 'resend';

export interface SendInvitationEmailParams {
  to: string;
  guestName: string;
  householdName?: string | null;
  maxAttendees: number;
  invitationUrl: string;
  customMessage?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
}

export async function sendInvitationEmail(params: SendInvitationEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Resend API key is not configured in environment variables.' };
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const cleanTo = params.to.trim();

  const greetingName = params.householdName ? `${params.guestName} & Family` : params.guestName;
  const subject = `Wedding Invitation for ${greetingName} | Chathura & Gimasha`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f3ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1815;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f3ec; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #dfba6a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(20, 62, 38, 0.08);">
          <tr>
            <td style="padding: 40px 36px 20px; text-align: center; background: radial-gradient(circle at 50% 20%, #fffbf2 0%, #ffffff 100%);">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.28em; color: #9e7828; text-transform: uppercase; margin-bottom: 12px;">
                A CELEBRATION OF LOVE
              </div>
              <h1 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 38px; font-weight: normal; color: #0e2e1c; line-height: 1.15;">
                Chathura <span style="color: #c59b43;">&amp;</span> Gimasha
              </h1>
              <div style="color: #c59b43; font-size: 14px; margin: 10px 0 16px;">
                ── ♥ ──
              </div>
              <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.18em; color: #143e26; text-transform: uppercase;">
                DECEMBER 03, 2026 &bull; GIRITHALE, SRI LANKA
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 10px 36px 36px; text-align: center;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; color: #143e26; font-weight: normal;">
                Dear ${greetingName},
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #5a4f45;">
                With the blessings of our parents, we warmly invite you to share in our joy as we unite our lives in marriage.
              </p>

              ${
                params.customMessage
                  ? `<div style="background-color: #fcf9f2; border-left: 3px solid #c59b43; padding: 12px 16px; margin: 18px 0; text-align: left; font-size: 14px; font-style: italic; color: #143e26; border-radius: 4px;">
                      “${params.customMessage}”
                    </div>`
                  : ''
              }

              <div style="background-color: #faf6ee; border: 1px dashed #d4af37; border-radius: 10px; padding: 16px; margin: 24px 0;">
                <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: #9e7828; text-transform: uppercase; margin-bottom: 4px;">
                  RESERVED SEATS
                </div>
                <div style="font-size: 18px; font-weight: 700; color: #0e2e1c;">
                  Up to ${params.maxAttendees} ${params.maxAttendees === 1 ? 'Guest' : 'Guests'}
                </div>
                <div style="font-size: 13px; color: #8c7e73; margin-top: 4px;">
                  The Deer Park Hotel &bull; 07:30 AM Poruwa Ceremony
                </div>
              </div>

              <div style="margin: 32px 0 24px;">
                <a href="${params.invitationUrl}" target="_blank" style="display: inline-block; background-color: #0e2e1c; color: #faeccf; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.05em; border: 1px solid #c59b43; box-shadow: 0 4px 14px rgba(14, 46, 28, 0.2);">
                  Open Personal Invitation &amp; RSVP &rarr;
                </a>
              </div>

              <p style="margin: 0; font-size: 12px; color: #8c7e73; line-height: 1.5;">
                Please respond through your personal link above to confirm your attendance and party size.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 36px; background-color: #fbf8f2; border-top: 1px solid #faeccf; text-align: center; font-size: 12px; color: #8c7e73;">
              This invitation was personally addressed to ${params.guestName}.<br>
              Chathura &amp; Gimasha Wedding &bull; All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: cleanTo,
      subject,
      html,
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to dispatch email' };
    }

    return { success: true, emailId: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resend error';
    return { success: false, error: message };
  }
}
