const { db } = require('../db');

/**
 * Generates an auto-incrementing unique invoice number for the given date.
 * Format: INV-YYYYMMDD-0001
 */
async function generateInvoiceNumber(dateStr = null) {
  let dateCode;
  if (dateStr && typeof dateStr === 'string' && dateStr.includes('-')) {
    dateCode = dateStr.replace(/-/g, '').slice(0, 8);
  } else {
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dateCode = `${year}${month}${day}`;
  }

  const prefix = `INV-${dateCode}-`;

  // Find count or max invoice number for this date prefix
  const result = await db.all(
    `SELECT invoice_no FROM deliveries WHERE invoice_no LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result.length > 0 && result[0].invoice_no) {
    const lastInvoice = result[0].invoice_no;
    const parts = lastInvoice.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}

module.exports = {
  generateInvoiceNumber
};
