const mailService = require('../services/mailService');
const { db } = require('../db');
const { getStockSummary } = require('../services/stockCalculator');
const logger = require('../config/logger');

/**
 * Send custom or administrative notification to admin
 */
async function sendAdminNotification(req, res, next) {
  try {
    const { subject, title, message, metadata, callToAction } = req.body;

    const result = await mailService.sendAdminMail({
      subject: subject || 'Administrative System Notice',
      title: title || 'Hatsun RDMS Alert',
      message: message || 'This is an administrative test notification from Hatsun Route Delivery Management System.',
      metadata: metadata || [],
      callToAction
    });

    res.json({
      success: true,
      message: 'Admin notification email sent successfully.',
      ...result
    });
  } catch (err) {
    logger.error('Failed to send admin notification email', { error: err.message });
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
  getMailStatus
};
