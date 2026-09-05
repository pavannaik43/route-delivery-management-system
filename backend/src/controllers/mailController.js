const mailService = require('../services/mailService');
const { db } = require('../db');
const { getStockSummary } = require('../services/stockCalculator');
const logger = require('../config/logger');

/**
 * Send custom or administrative notification to admin or custom recipient
 * Optionally attaches a tax invoice if invoiceId is provided
 */
async function sendAdminNotification(req, res, next) {
  try {
    const { to, subject, title, message, metadata, callToAction, invoiceId } = req.body;

    // If an invoice is attached, load it and dispatch formatted invoice email
    if (invoiceId) {
      const delivery = await db.get(
        `SELECT 
          d.id AS delivery_id,
          d.invoice_no,
          d.delivery_date,
          d.total_amount,
          s.shop_name,
          s.owner_name,
          s.phone AS shop_phone,
          s.route
         FROM deliveries d
         JOIN shops s ON s.id = d.shop_id
         WHERE d.id = ?`,
        [invoiceId]
      );

      if (!delivery) {
        return res.status(404).json({ success: false, message: 'Invoice not found for the specified ID.' });
      }

      const items = await db.all(
        `SELECT 
          di.*,
          p.name AS product_name,
          p.category,
          p.size
         FROM delivery_items di
         JOIN products p ON p.id = di.product_id
         WHERE di.delivery_id = ?`,
        [invoiceId]
      );

      const invoiceData = {
        ...delivery,
        items
      };

      const result = await mailService.sendInvoiceMail({
        to,
        invoice: invoiceData,
        message: message || `Attached please find the official Hatsun Agro Products tax invoice #${delivery.invoice_no} for ${delivery.shop_name}.`
      });

      return res.json({
        success: true,
        message: `Tax Invoice #${delivery.invoice_no} dispatched successfully!`,
        ...result
      });
    }

    // Standard notification
    const result = await mailService.sendAdminMail({
      to,
      subject: subject || 'Administrative System Notice',
      title: title || 'Hatsun RDMS Alert',
      message: message || 'This is an administrative notification from Hatsun Route Delivery Management System.',
      metadata: metadata || [],
      callToAction
    });

    res.json({
      success: true,
      message: 'Email notification sent successfully.',
      ...result
    });
  } catch (err) {
    logger.error('Failed to send admin notification email', { error: err.message });
    next(err);
  }
}

/**
 * Send an invoice directly by delivery/invoice ID
 */
async function sendInvoiceEmail(req, res, next) {
  try {
    const { deliveryId, to, message } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ success: false, message: 'deliveryId is required to email invoice.' });
    }

    const delivery = await db.get(
      `SELECT 
        d.id AS delivery_id,
        d.invoice_no,
        d.delivery_date,
        d.total_amount,
        s.shop_name,
        s.owner_name,
        s.phone AS shop_phone,
        s.route
       FROM deliveries d
       JOIN shops s ON s.id = d.shop_id
       WHERE d.id = ?`,
      [deliveryId]
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Invoice record not found.' });
    }

    const items = await db.all(
      `SELECT 
        di.*,
        p.name AS product_name,
        p.category,
        p.size
       FROM delivery_items di
       JOIN products p ON p.id = di.product_id
       WHERE di.delivery_id = ?`,
      [deliveryId]
    );

    const result = await mailService.sendInvoiceMail({
      to,
      invoice: { ...delivery, items },
      message: message || `Attached is your Hatsun Agro Products delivery invoice #${delivery.invoice_no}.`
    });

    res.json({
      success: true,
      message: `Tax Invoice #${delivery.invoice_no} sent successfully!`,
      ...result
    });
  } catch (err) {
    logger.error('Failed to email invoice', { error: err.message });
    next(err);
  }
}

/**
 * Send today's dispatch & settlement summary to admin
 */
async function sendDaySummaryEmail(req, res, next) {
  try {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Deliveries summary
    const delSummary = await db.get(
      `SELECT 
        COUNT(id) AS total_deliveries,
        COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM deliveries
       WHERE delivery_date = ?`,
      [targetDate]
    );

    // Stock breakdown
    const stock = await getStockSummary(targetDate);
    const totalLoaded = stock.reduce((s, i) => s + i.loadedQuantity, 0);
    const totalDelivered = stock.reduce((s, i) => s + i.deliveredQuantity, 0);
    const totalRemaining = stock.reduce((s, i) => s + i.remainingStock, 0);

    const result = await mailService.sendDailySummaryMail({
      date: targetDate,
      totalRevenue: Number(delSummary.total_revenue) || 0,
      totalDeliveries: Number(delSummary.total_deliveries) || 0,
      totalLoaded,
      totalDelivered,
      totalRemaining
    });

    res.json({
      success: true,
      message: `Daily summary report for ${targetDate} dispatched to admin.`,
      ...result
    });
  } catch (err) {
    logger.error('Failed to send daily summary email', { error: err.message });
    next(err);
  }
}

/**
 * Get mail service operational status
 */
async function getMailStatus(req, res, next) {
  try {
    const status = await mailService.checkMailStatus();
    res.json({
      success: true,
      status
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendAdminNotification,
  sendDaySummaryEmail,
  sendInvoiceEmail,
  getMailStatus
};
