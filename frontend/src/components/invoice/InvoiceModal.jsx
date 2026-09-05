import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PrintableInvoice } from './PrintableInvoice';
import { Printer, Download, CheckCircle, Mail, Send, Check } from 'lucide-react';
import { sendInvoiceMailApi } from '../../api/endpoints';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('pavannaik1689@gmail.com');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendInvoiceEmail = async () => {
    if (!emailRecipient) return;
    try {
      setIsEmailing(true);
      await sendInvoiceMailApi({
        deliveryId: invoice.delivery_id || invoice.id,
        to: emailRecipient,
        message: `Attached is the official Hatsun Agro Products tax invoice #${invoice.invoice_no} for ${invoice.shop_name}.`
      });
      setEmailSentSuccess(true);
      setTimeout(() => {
        setEmailSentSuccess(false);
        setShowEmailInput(false);
      }, 2500);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to send invoice email.');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-invoice');
    if (!element) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const invNo = invoice.invoice_no || invoice.invoiceNo || 'invoice';
      pdf.save(`${invNo}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try the Print option.');
    } finally {
      setIsExporting(false);
    }
  };

  const invNo = invoice.invoice_no || invoice.invoiceNo || 'INV-DRAFT';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice: ${invNo}`}
      subtitle="Generated upon delivery confirmation"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Delivery Recorded & Stock Decremented</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="bg-white text-primary border-primary/30 hover:bg-primary/5"
            >
              <Mail className="w-4 h-4 mr-1 text-primary" />
              Email Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white"
            >
              <Printer className="w-4 h-4 mr-1 text-slate-600" />
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isExporting}
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Inline Email Recipient Input */}
        {showEmailInput && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 no-print">
            <label className="block text-xs font-bold text-slate-700">
              Email Invoice To:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="Enter recipient email address..."
                className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                variant="primary"
                size="sm"
                isLoading={isEmailing}
                onClick={handleSendInvoiceEmail}
                disabled={emailSentSuccess}
                className="font-bold whitespace-nowrap"
              >
                {emailSentSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-emerald-300" />
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Invoice Component */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-inner border border-slate-200 p-2">
          <PrintableInvoice invoice={invoice} id="printable-invoice" />
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2 no-print">
          <Button variant="outline" size="md" onClick={onClose}>
            Done / Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
