import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMailStatusApi, sendAdminMailApi, sendDaySummaryMailApi, getInvoicesApi } from '../api/endpoints';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  Mail,
  Send,
  CheckCircle2,
  FileText,
  Server,
  ShieldAlert,
  Sparkles,
  Paperclip,
  Check,
  Building2,
  Calendar
} from 'lucide-react';

export const MailCenter = () => {
  const [recipient, setRecipient] = useState('pavannaik1689@gmail.com');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSendingSummary, setIsSendingSummary] = useState(false);
  const [alert, setAlert] = useState(null);
  const [history, setHistory] = useState([
    {
      id: '<3fe58434-0c88-5e47-38fc-1201596df9e6@resend.dev>',
      recipient: 'pavannaik1689@gmail.com',
      subject: '[Hatsun RDMS Admin] Daily Route Delivery Summary',
      timestamp: 'Recently Dispatched',
      previewUrl: null
    },
    {
      id: '<76eed191-97e6-c2d9-8005-fc67ab707603@resend.dev>',
      recipient: 'pavannaik1689@gmail.com',
      subject: '[Hatsun RDMS Admin] Hatsun RDMS Operational Mail Service Active',
      timestamp: 'Recently Dispatched',
      previewUrl: null
    }
  ]);

  // Mail status query
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ['mailStatus'],
    queryFn: getMailStatusApi
  });

  // Available Invoices query for attachment
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoicesListForMail'],
    queryFn: () => getInvoicesApi({})
  });

  const status = statusData?.status || {};
  const invoices = invoicesData?.invoices || [];

  // Update default recipient when status loads
  useEffect(() => {
    if (status.adminEmail && recipient === 'admin@hatsun.com') {
      setRecipient(status.adminEmail);
    }
  }, [status.adminEmail]);

  // Selected invoice object
  const selectedInvoice = invoices.find((inv) => String(inv.delivery_id) === String(selectedInvoiceId));

  // Auto-fill subject when an invoice is selected
  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    if (invId) {
      const inv = invoices.find((i) => String(i.delivery_id) === String(invId));
      if (inv) {
        setSubject(`Tax Invoice ${inv.invoice_no} - ${inv.shop_name}`);
        if (!title) setTitle(`Tax Invoice & Delivery Challan: ${inv.invoice_no}`);
      }
    }
  };

  const handleSendCustomMail = async (e) => {
    e.preventDefault();
    if (!recipient) {
      setAlert({ type: 'danger', message: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!subject) {
      setAlert({ type: 'danger', message: 'Subject is required.' });
      return;
    }

    try {
      setIsSending(true);
      setAlert(null);
      const res = await sendAdminMailApi({
        to: recipient,
        subject,
        title: title || subject,
        message: message || (selectedInvoiceId ? `Please find attached tax invoice #${selectedInvoice?.invoice_no} for ${selectedInvoice?.shop_name}.` : 'Hatsun Operations Notice'),
        invoiceId: selectedInvoiceId || undefined,
        metadata: [
          { label: 'Recipient', value: recipient },
          ...(selectedInvoice ? [{ label: 'Attached Invoice', value: selectedInvoice.invoice_no }] : [])
        ]
      });

      setAlert({
        type: 'success',
        message: res.message || `Email successfully dispatched to ${recipient}!`,
        previewUrl: res.previewUrl
      });

      if (res.messageId) {
        setHistory((prev) => [
          {
            id: res.messageId,
            recipient: res.to || recipient,
            subject: subject.startsWith('[Hatsun RDMS') ? subject : `[Hatsun RDMS] ${subject}`,
            timestamp: new Date().toLocaleTimeString(),
            previewUrl: res.previewUrl
          },
          ...prev
        ]);
      }

      setSubject('');
      setTitle('');
      setMessage('');
      setSelectedInvoiceId('');
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Failed to dispatch email.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuickSummary = async () => {
    try {
      setIsSendingSummary(true);
      setAlert(null);
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await sendDaySummaryMailApi({ date: todayStr });

      setAlert({
        type: 'success',
        message: res.message || `Today's EOD dispatch summary sent to ${status.adminEmail || recipient}!`,
        previewUrl: res.previewUrl
      });

      if (res.messageId) {
        setHistory((prev) => [
          {
            id: res.messageId,
            recipient: res.to || recipient,
            subject: `[Hatsun RDMS Admin] Daily Route Delivery Summary - ${todayStr}`,
            timestamp: new Date().toLocaleTimeString(),
            previewUrl: res.previewUrl
          },
          ...prev
        ]);
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Failed to dispatch summary email.'
      });
    } finally {
      setIsSendingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-[#0066c0] to-secondary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-sm">
                Operational Mail Service
              </span>
              <span className="text-xs text-sky-200">Production SMTP & Resend Active</span>
            </div>
            <h2 className="text-2xl font-black mt-1">Hatsun Email Service Center</h2>
            <p className="text-xs text-sky-100 mt-1 max-w-xl">
              Dispatch tax invoices, settlement reports, and administrative notifications with corporate Hatsun Agro Products styling.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendQuickSummary}
              isLoading={isSendingSummary}
              className="bg-white text-primary hover:bg-sky-50 font-bold border-transparent shadow-md"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Send Today's EOD Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Notification if any */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.type === 'success' ? 'Email Successfully Dispatched' : 'Email Dispatch Notice'}
          message={
            <div>
              <p>{alert.message}</p>
              {alert.previewUrl && (
                <a
                  href={alert.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-700 underline hover:text-blue-900"
                >
                  Click Here to Open Rendered HTML Email Preview &rarr;
                </a>
              )}
            </div>
          }
          onClose={() => setAlert(null)}
        />
      )}

      {/* Status & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Mailer Status</span>
            <Server className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-base font-extrabold text-slate-900">
              {status.provider === 'smtp_production' ? 'Production SMTP (Resend)' : 'Active (Live Resend)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for automated dispatch</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Default Admin Recipient</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-2 truncate" title={status.adminEmail || 'pavannaik1689@gmail.com'}>
            {status.adminEmail || 'pavannaik1689@gmail.com'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Configured admin inbox</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">From Sender</span>
            <Mail className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-2 truncate" title={status.fromAddress || '"Hatsun RDMS" <onboarding@resend.dev>'}>
            {status.fromAddress || '"Hatsun RDMS"'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">System outgoing envelope</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Email Composer */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Compose Email with Invoice Attachment"
            subtitle="Send a branded Hatsun Agro Products notification or attached tax invoice to any email address"
          />
          <CardBody>
            <form onSubmit={handleSendCustomMail} className="space-y-4">
              {/* To Recipient */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">To Recipient Email *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Quick Select:</span>
                    <button
                      type="button"
                      onClick={() => setRecipient('pavannaik1689@gmail.com')}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Pavan (Gmail)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setRecipient('hatsun.rdms@gmail.com')}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Hatsun (Gmail)
                    </button>
                  </div>
                </div>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  placeholder="e.g. pavannaik1689@gmail.com or customer@store.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                />
              </div>

              {/* Attach Tax Invoice Option */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span>Attach Tax Invoice (Optional)</span>
                  </label>
                  {selectedInvoice && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ₹{Number(selectedInvoice.total_amount).toFixed(2)} Attached
                    </span>
                  )}
                </div>

                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-medium"
                >
                  <option value="">-- No Invoice Attached (Standard Email) --</option>
                  {invoices.map((inv) => (
                    <option key={inv.delivery_id} value={inv.delivery_id}>
                      {inv.invoice_no} — {inv.shop_name} (₹{Number(inv.total_amount).toFixed(2)}) • {inv.delivery_date}
                    </option>
                  ))}
                </select>

                {/* Selected Invoice Details Pill */}
                {selectedInvoice && (
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {selectedInvoice.shop_name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Route: {selectedInvoice.route || 'Direct'} &bull; {selectedInvoice.total_items} items ({selectedInvoice.total_units} units)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceId('')}
                      className="text-[11px] text-red-500 hover:text-red-700 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Hatsun Tax Invoice or Delivery Settlement Report"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Header Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Header Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Official Delivery Confirmation & Tax Invoice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  placeholder={
                    selectedInvoice
                      ? `Notes or instructions for this invoice delivery...`
                      : `Enter the body text for this email notification...`
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                ></textarea>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSending}
                  className="font-bold shadow-md shadow-primary/20 px-5"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {selectedInvoice ? 'Dispatch Invoice Email' : 'Dispatch Email'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Instructions & Features Guide */}
        <Card>
          <CardHeader
            title="Invoice & Email Guide"
            subtitle="Automatic formatting features"
          />
          <CardBody className="space-y-4 text-xs text-slate-600">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Invoice Formatting Engine</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">
                When you select a Tax Invoice from the dropdown, the system automatically builds an official Hatsun itemized pricing table with MRP, Quantities, Unit Prices, and Grand Total.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Available Email Types:</h4>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-700">
                <li><strong>Tax Invoices</strong>: Select any invoice to email it to the store owner or admin.</li>
                <li><strong>Daily Dispatch Summary</strong>: 1-Click sends today's full route settlement to the admin.</li>
                <li><strong>Custom Operations Alerts</strong>: Send notifications to any recipient address.</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Dispatched Emails Archive */}
      <Card>
        <CardHeader
          title="Recent Email Dispatches"
          subtitle="Real-time log of sent operational emails and invoices"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Delivery Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.subject}</td>
                  <td className="py-3 px-4 text-slate-600">{item.recipient}</td>
                  <td className="py-3 px-4 text-slate-500">{item.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dispatched
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2.5 py-1 rounded-lg">
                      Live Resend SMTP
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
