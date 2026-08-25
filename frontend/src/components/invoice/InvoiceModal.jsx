import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PrintableInvoice } from './PrintableInvoice';
import { Printer, Download, CheckCircle, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
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

          <div className="flex items-center gap-2">
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
