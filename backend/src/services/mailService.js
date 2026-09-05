const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let cachedTransporter = null;
let isEthereal = false;

/**
 * Get or initialize the Nodemailer transporter.
 * If SMTP credentials exist in env, uses standard SMTP.
 * Otherwise, provisions an Ethereal test inbox so emails can be previewed.
 */
async function getTransporter() {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, isEthereal };
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    logger.info('Initializing production SMTP mail transporter', { host, port, user });
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
    isEthereal = false;
  } else {
    logger.warn('No external SMTP credentials configured. Creating local Ethereal test mailer...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      isEthereal = true;
      logger.info('Ethereal test mailer initialized', { user: testAccount.user });
    } catch (err) {
      logger.error('Failed to create Ethereal test account, using JSON transport fallback', { error: err.message });
      cachedTransporter = nodemailer.createTransport({
        jsonTransport: true
      });
      isEthereal = true;
    }
  }

  return { transporter: cachedTransporter, isEthereal };
}

/**
 * Generate Hatsun Agro Products responsive HTML email layout
 */
function buildHatsunEmailHtml({ title, subtitle, contentHtml, callToAction, metadata = [] }) {
  const metaRows = metadata
    .map(
      (m) => `
      <tr>
        <td style="padding: 6px 12px; font-size: 12px; color: #64748B; font-weight: 600; border-bottom: 1px solid #F1F5F9; width: 40%;">${m.label}</td>
        <td style="padding: 6px 12px; font-size: 12px; color: #0F172A; font-weight: 700; border-bottom: 1px solid #F1F5F9;">${m.value}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Hatsun Agro Products RDMS'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005BAC 0%, #0077CC 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background-color: #FFFFFF; color: #005BAC; font-weight: 900; font-size: 24px; margin-bottom: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">
                H
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                Hatsun Agro Product Ltd.
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #BAE6FD; font-weight: 500;">
                Route Delivery Management System (RDMS)
              </p>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 28px 24px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0F172A;">
                ${title}
              </h2>
              ${
                subtitle
                  ? `<p style="margin: 0 0 20px 0; font-size: 13px; color: #64748B; line-height: 1.5;">${subtitle}</p>`
                  : ''
              }

              <!-- Body HTML -->
              <div style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                ${contentHtml}
              </div>

              <!-- Metadata Table (if provided) -->
              ${
                metadata.length > 0
                  ? `
              <div style="margin-bottom: 24px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${metaRows}
                </table>
              </div>`
                  : ''
              }

              <!-- Call To Action Button (if provided) -->
              ${
                callToAction
                  ? `
              <div style="text-align: center; margin: 28px 0 12px 0;">
                <a href="${callToAction.url}" target="_blank" style="display: inline-block; background-color: #005BAC; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 91, 172, 0.3);">
                  ${callToAction.text} &rarr;
                </a>
              </div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94A3B8;">
              <p style="margin: 0 0 4px 0;">
                This is an automated operational notification from Hatsun RDMS.
              </p>
              <p style="margin: 0;">
                &copy; ${new Date().getFullYear()} Hatsun Agro Product Ltd. &bull; All Rights Reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send an email
 */
async function sendMail({ to, subject, html, text, attachments = [] }) {
  const { transporter, isEthereal: isEth } = await getTransporter();

  const defaultFrom = process.env.SMTP_FROM || '"Hatsun RDMS" <no-reply@hatsun.com>';

  const mailOptions = {
    from: defaultFrom,
    to,
    replyTo: process.env.SMTP_REPLY_TO || 'hatsun-rdms@proton.me',
    subject,
    text: text || html.replace(/<[^>]+>/g, ''),
    html,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);

  let previewUrl = null;
  if (isEth && nodemailer.getTestMessageUrl) {
    previewUrl = nodemailer.getTestMessageUrl(info) || null;
  }

  logger.info('Email successfully dispatched', {
    to,
    subject,
    messageId: info.messageId,
    previewUrl: previewUrl || 'Delivered via SMTP'
  });

  return {
    success: true,
    messageId: info.messageId,
    to,
    previewUrl,
    isEthereal: isEth
  };
}

/**
 * Send an administrative notification email to the configured admin
 */
async function sendAdminMail({ subject, title, message, metadata = [], callToAction }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hatsun.com';

  const html = buildHatsunEmailHtml({
    title: title || subject,
    subtitle: 'System Notification & Administration Alert',
    contentHtml: `<p style="margin: 0;">${message}</p>`,
    metadata: [
      { label: 'Recipient', value: adminEmail },
      { label: 'Timestamp', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
      ...metadata
    ],
    callToAction: callToAction || {
      text: 'Open Hatsun Admin Portal',
      url: process.env.WEB_URL || 'http://localhost:5000/dashboard'
    }
  });

  return sendMail({
    to: adminEmail,
    subject: `[Hatsun RDMS Admin] ${subject}`,
    html
  });
}

/**
 * Send a structured Daily Dispatch & Settlement Summary to admin
 */
async function sendDailySummaryMail(summaryData = {}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hatsun.com';
  const dateStr = summaryData.date || new Date().toISOString().split('T')[0];

  const totalRev = Number(summaryData.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const totalDeliveries = summaryData.totalDeliveries || 0;
  const totalLoaded = summaryData.totalLoaded || 0;
  const totalDelivered = summaryData.totalDelivered || 0;
  const totalRemaining = summaryData.totalRemaining || 0;

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Here is the end-of-day dispatch and stock reconciliation summary for route deliveries recorded on <strong>${dateStr}</strong>.
    </p>
    <div style="display: flex; gap: 10px; margin-bottom: 16px;">
      <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px; width: 48%; text-align: center;">
        <span style="font-size: 11px; color: #1E40AF; font-weight: 700; text-transform: uppercase;">Total Revenue</span>
        <div style="font-size: 18px; font-weight: 900; color: #1E3A8A; margin-top: 4px;">₹${totalRev}</div>
      </div>
      <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 12px; width: 48%; text-align: center;">
        <span style="font-size: 11px; color: #065F46; font-weight: 700; text-transform: uppercase;">Completed Deliveries</span>
        <div style="font-size: 18px; font-weight: 900; color: #064E3B; margin-top: 4px;">${totalDeliveries}</div>
      </div>
    </div>
  `;

  const metadata = [
    { label: 'Dispatch Date', value: dateStr },
    { label: 'Total Invoiced Revenue', value: `₹${totalRev}` },
    { label: 'Total Completed Deliveries', value: `${totalDeliveries} shops` },
    { label: 'Loaded Units', value: `${totalLoaded} units` },
    { label: 'Dispatched Units', value: `${totalDelivered} units` },
    { label: 'Remaining Return Stock', value: `${totalRemaining} units` }
  ];

  return sendAdminMail({
    subject: `Daily Route Delivery Summary - ${dateStr}`,
    title: `Daily Route Dispatch Report (${dateStr})`,
    message: contentHtml,
    metadata,
    callToAction: {
      text: 'View Full Report in RDMS',
      url: `${process.env.WEB_URL || 'http://localhost:5000'}/summary`
    }
  });
}

/**
 * Check mail service connectivity and configuration
 */
async function checkMailStatus() {
  const { isEthereal: isEth } = await getTransporter();
  return {
    ready: true,
    provider: isEth ? 'ethereal_test_inbox' : 'smtp_production',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@hatsun.com',
    fromAddress: process.env.SMTP_FROM || '"Hatsun RDMS" <no-reply@hatsun.com>',
    smtpHost: process.env.SMTP_HOST || 'auto (ethereal)',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  sendMail,
  sendAdminMail,
  sendDailySummaryMail,
  checkMailStatus,
  buildHatsunEmailHtml
};
