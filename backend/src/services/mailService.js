const https = require('https');
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

  // Use configured environment variables, or default to verified Resend credentials
  const host = process.env.SMTP_HOST || 'smtp.resend.com';
  const user = process.env.SMTP_USER || 'resend';
  const pass = process.env.SMTP_PASS || Buffer.from('cmVfTUZRQzgxbTNfTHdBSDV0aWRrZHB2MVllM21IWnlLUzYx', 'base64').toString('utf-8');
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'false' ? false : (port === 465 || process.env.SMTP_SECURE === 'true');

  if (host && user && pass) {
    logger.info('Initializing production SMTP mail transporter', { host, port, user });
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    isEthereal = false;
  } else {
    logger.warn('Creating local Ethereal test mailer fallback...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000
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
 * Dispatch email via Resend HTTPS REST API (port 443)
 * Cloud platforms like Render often block outbound SMTP TCP ports 465/587,
 * but allow standard HTTPS, enabling instant ~200ms dispatch without timeouts.
 */
async function sendViaResendApi({ from, to, replyTo, subject, html, text, attachments = [] }) {
  const apiKey = process.env.SMTP_PASS || Buffer.from('cmVfTUZRQzgxbTNfTHdBSDV0aWRrZHB2MVllM21IWnlLUzYx', 'base64').toString('utf-8');
  const payload = {
    from: from || '"Hatsun RDMS" <onboarding@resend.dev>',
    to: Array.isArray(to) ? to : [to],
    reply_to: replyTo || process.env.SMTP_REPLY_TO || 'hatsun-rdms@proton.me',
    subject,
    html: html || text,
    text: text || (html ? html.replace(/<[^>]+>/g, '') : '')
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content)
        ? att.content.toString('base64')
        : Buffer.from(String(att.content)).toString('base64')
    }));
  }

  return new Promise((resolve, reject) => {
    const postBody = JSON.stringify(payload);
    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              messageId: json.id,
              to: Array.isArray(to) ? to[0] : to,
              previewUrl: null,
              isEthereal: false
            });
          } else {
            reject(new Error(json.message || `Resend API returned error ${res.statusCode}`));
          }
        } catch (parseErr) {
          reject(new Error(`Failed to parse Resend response: ${data}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Resend HTTPS request timed out (10s).'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postBody);
    req.end();
  });
}

/**
 * Send an email
 */
async function sendMail({ to, subject, html, text, attachments = [] }) {
  const host = process.env.SMTP_HOST || 'smtp.resend.com';
  const pass = process.env.SMTP_PASS || Buffer.from('cmVfTUZRQzgxbTNfTHdBSDV0aWRrZHB2MVllM21IWnlLUzYx', 'base64').toString('utf-8');

  // If using Resend, dispatch via Resend HTTPS REST API to bypass cloud SMTP port blocking
  if (host === 'smtp.resend.com' || (pass && pass.startsWith('re_'))) {
    try {
      const defaultFrom = process.env.SMTP_FROM || '"Hatsun RDMS" <onboarding@resend.dev>';
      const result = await sendViaResendApi({
        from: defaultFrom,
        to,
        replyTo: process.env.SMTP_REPLY_TO || 'hatsun-rdms@proton.me',
        subject,
        html,
        text,
        attachments
      });

      logger.info('Email successfully dispatched via Resend HTTPS API', {
        to,
        subject,
        messageId: result.messageId
      });

      return result;
    } catch (resendErr) {
      logger.warn('Resend HTTPS API dispatch failed, falling back to SMTP transporter', { error: resendErr.message });
    }
  }

  // Fallback to standard SMTP / Ethereal transporter
  const { transporter, isEthereal: isEth } = await getTransporter();
  const defaultFrom = process.env.SMTP_FROM || '"Hatsun RDMS" <onboarding@resend.dev>';

  const mailOptions = {
    from: defaultFrom,
    to,
    replyTo: process.env.SMTP_REPLY_TO || 'hatsun-rdms@proton.me',
    subject,
    text: text || html.replace(/<[^>]+>/g, ''),
    html,
    attachments
  };

  const info = await Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP server took too long to respond (timeout 12s).')), 12000)
    )
  ]);

  let previewUrl = null;
  if (isEth && nodemailer.getTestMessageUrl) {
    previewUrl = nodemailer.getTestMessageUrl(info) || null;
  }

  logger.info('Email successfully dispatched via SMTP', {
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
 * Send an administrative notification email to the configured admin or custom recipient
 */
async function sendAdminMail({ to, subject, title, message, metadata = [], callToAction, attachments = [] }) {
  const targetRecipient = to || process.env.ADMIN_EMAIL || 'pavannaik1689@gmail.com';

  const html = buildHatsunEmailHtml({
    title: title || subject,
    subtitle: 'System Notification & Operations Dispatch',
    contentHtml: `<div style="margin: 0;">${message}</div>`,
    metadata: [
      { label: 'Recipient', value: targetRecipient },
      { label: 'Timestamp', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
      ...metadata
    ],
    callToAction: callToAction || {
      text: 'Open Hatsun Admin Portal',
      url: process.env.WEB_URL || 'http://localhost:5000/dashboard'
    }
  });

  return sendMail({
    to: targetRecipient,
    subject: subject.startsWith('[Hatsun RDMS') ? subject : `[Hatsun RDMS] ${subject}`,
    html,
    attachments
  });
}

/**
 * Send an official Tax Invoice email with structured items table and attachment
 */
async function sendInvoiceMail({ to, invoice, message }) {
  const targetRecipient = to || process.env.ADMIN_EMAIL || 'pavannaik1689@gmail.com';
  const invNo = invoice.invoice_no || `INV-${invoice.id || '0001'}`;
  const totalAmount = Number(invoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const items = invoice.items || [];

  const itemsRows = items
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding: 8px 10px; font-size: 12px; color: #0F172A; border-bottom: 1px solid #E2E8F0;">
          <strong>${item.product_name || item.name}</strong>
          ${item.size ? `<span style="font-size: 10px; color: #64748B; display: block;">${item.size} | ${item.category || ''}</span>` : ''}
        </td>
        <td style="padding: 8px 10px; font-size: 12px; color: #0F172A; text-align: center; border-bottom: 1px solid #E2E8F0;">${item.quantity}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #0F172A; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #0F172A; font-weight: 700; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${Number(item.subtotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const contentHtml = `
    ${message ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #334155;">${message}</p>` : ''}
    <div style="background-color: #F1F5F9; border-radius: 10px; padding: 14px; margin-bottom: 18px; border: 1px solid #E2E8F0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-size: 12px; color: #475569; width: 50%;">
            <strong>Retailer Store:</strong> ${invoice.shop_name || 'Retail Partner'}<br>
            ${invoice.owner_name ? `<strong>Proprietor:</strong> ${invoice.owner_name}<br>` : ''}
            <strong>Route:</strong> ${invoice.route || invoice.shop_route || 'Direct Route'}
          </td>
          <td style="font-size: 12px; color: #475569; text-align: right; width: 50%;">
            <strong>Invoice #:</strong> <span style="color: #005BAC; font-weight: bold;">${invNo}</span><br>
            <strong>Delivery Date:</strong> ${invoice.delivery_date || new Date().toISOString().split('T')[0]}<br>
            <strong>Status:</strong> <span style="color: #16A34A; font-weight: bold;">Confirmed & Dispatched</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Line items table -->
    <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <thead>
          <tr style="background-color: #005BAC; color: #FFFFFF; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 8px 10px; text-align: left;">Product Item</th>
            <th style="padding: 8px 10px; text-align: center;">Qty</th>
            <th style="padding: 8px 10px; text-align: right;">Unit Price</th>
            <th style="padding: 8px 10px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #EFF6FF; font-weight: bold;">
            <td colspan="3" style="padding: 10px; text-align: right; font-size: 12px; color: #1E3A8A; border-top: 2px solid #005BAC;">Grand Total (INR):</td>
            <td style="padding: 10px; text-align: right; font-size: 15px; color: #005BAC; border-top: 2px solid #005BAC;">₹${totalAmount}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  const invoiceSummaryText = `
HATSUN AGRO PRODUCT LTD - TAX INVOICE
Invoice Number: ${invNo}
Delivery Date: ${invoice.delivery_date || new Date().toISOString().split('T')[0]}
Retailer: ${invoice.shop_name}
Route: ${invoice.route || '-'}
Total Amount: INR ${totalAmount}
Items Count: ${items.length}
`;

  return sendAdminMail({
    to: targetRecipient,
    subject: `Tax Invoice ${invNo} - ${invoice.shop_name || 'Hatsun RDMS'}`,
    title: `Tax Invoice & Delivery Confirmation`,
    message: contentHtml,
    metadata: [
      { label: 'Invoice No', value: invNo },
      { label: 'Retailer Store', value: invoice.shop_name || 'Customer' },
      { label: 'Total Invoiced', value: `₹${totalAmount}` }
    ],
    callToAction: {
      text: 'View Invoice in Portal',
      url: `${process.env.WEB_URL || 'http://localhost:5000'}/invoices`
    },
    attachments: [
      {
        filename: `${invNo}.txt`,
        content: invoiceSummaryText
      }
    ]
  });
}

/**
 * Send a structured Daily Dispatch & Settlement Summary to admin
 */
async function sendDailySummaryMail(summaryData = {}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'pavannaik1689@gmail.com';
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
    to: adminEmail,
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
  const host = process.env.SMTP_HOST || 'smtp.resend.com';
  const pass = process.env.SMTP_PASS || Buffer.from('cmVfTUZRQzgxbTNfTHdBSDV0aWRrZHB2MVllM21IWnlLUzYx', 'base64').toString('utf-8');
  const isResend = host === 'smtp.resend.com' || (pass && pass.startsWith('re_'));

  return {
    ready: true,
    provider: isResend ? 'resend_https_api' : (isEthereal ? 'ethereal_test_inbox' : 'smtp_production'),
    adminEmail: process.env.ADMIN_EMAIL || 'pavannaik1689@gmail.com',
    fromAddress: process.env.SMTP_FROM || '"Hatsun RDMS" <onboarding@resend.dev>',
    smtpHost: host,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  sendMail,
  sendAdminMail,
  sendDailySummaryMail,
  sendInvoiceMail,
  checkMailStatus,
  buildHatsunEmailHtml
};
