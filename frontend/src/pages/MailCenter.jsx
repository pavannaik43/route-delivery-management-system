import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMailStatusApi, sendAdminMailApi, sendDaySummaryMailApi } from '../api/endpoints';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  RefreshCw,
  FileText,
  ShieldAlert,
  Sparkles,
  Inbox
} from 'lucide-react';

export const MailCenter = () => {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('admin@hatsun.com');
  const [isSending, setIsSending] = useState(false);
  const [isSendingSummary, setIsSendingSummary] = useState(false);
  const [alert, setAlert] = useState(null);
  const [history, setHistory] = useState([
    {
      id: '<46b0e206-59c6-588e-3cd9-f762f9dd3990@hatsun.com>',
      recipient: 'admin@hatsun.com',
      subject: '[Hatsun RDMS Admin] Hatsun RDMS Operational Mail Service Active',
      timestamp: 'Recently Dispatched',
      previewUrl: 'https://ethereal.email/message/apyBqQlT7djrJGeCapyBrmNZ89.4y8jQAAAAAVMG9Gl.dxSOQP02yCHoJEQ'
    }
  ]);

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['mailStatus'],
    queryFn: getMailStatusApi
  });

  const status = statusData?.status || {};

  const handleSendCustomMail = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      setAlert({ type: 'danger', message: 'Subject and message are required.' });
      return;
    }

    try {
      setIsSending(true);
      setAlert(null);
      const res = await sendAdminMailApi({
        subject,
        title: title || subject,
        message,
        metadata: [{ label: 'Sender', value: 'Hatsun Operations Admin' }]
      });

      setAlert({
        type: 'success',
        message: res.message || 'Email dispatched successfully!',
        previewUrl: res.previewUrl
      });

      if (res.messageId) {
        setHistory((prev) => [
          {
            id: res.messageId,
            recipient: res.to || recipient,
            subject: `[Hatsun RDMS Admin] ${subject}`,
            timestamp: new Date().toLocaleTimeString(),
            previewUrl: res.previewUrl
          },
          ...prev
        ]);
      }

      setSubject('');
      setTitle('');
      setMessage('');
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
        message: res.message || `Today's EOD dispatch summary sent to admin!`,
        previewUrl: res.previewUrl
      });

      if (res.messageId) {
        setHistory((prev) => [
          {
            id: res.messageId,
            recipient: res.to || 'admin@hatsun.com',
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
              <span className="text-xs text-sky-200">System Transporter Active</span>
            </div>
            <h2 className="text-2xl font-black mt-1">Hatsun Email Service Center</h2>
            <p className="text-xs text-sky-100 mt-1 max-w-xl">
              Dispatch route summaries, low-stock warnings, and administrative notifications with corporate Hatsun Agro Products styling.
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
          title={alert.type === 'success' ? 'Email Successfully Dispatched' : 'Email Dispatch Error'}
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
              {status.provider === 'smtp_production' ? 'Production SMTP' : 'Active (Ethereal Preview)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for automated dispatch</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Admin Recipient</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-2 truncate" title={status.adminEmail || 'admin@hatsun.com'}>
            {status.adminEmail || 'admin@hatsun.com'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Default administrator address</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">From Sender</span>
            <Mail className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-2 truncate" title={status.fromAddress || '"Hatsun RDMS" <no-reply@hatsun.com>'}>
            {status.fromAddress || '"Hatsun RDMS"'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">System outgoing envelope</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Email Composer */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Compose Administrative Email"
            subtitle="Send a branded Hatsun Agro Products email notice to the administrator"
          />
          <CardBody>
            <form onSubmit={handleSendCustomMail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To Recipient</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Route 4 Settlement Audit or Depot Maintenance Notice"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Header Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Operations Briefing & Dispatch Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  placeholder="Enter the body text for this email notification..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSending}
                  className="font-bold shadow-md shadow-primary/20"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Dispatch Email
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Instructions & SMTP Configuration Info */}
        <Card>
          <CardHeader
            title="SMTP Configuration Guide"
            subtitle="Connect your production inbox"
          />
          <CardBody className="space-y-4 text-xs text-slate-600">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Zero-Config Preview Mode</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">
                In preview mode, all dispatched emails produce a secure Ethereal link so you can inspect the full HTML layout immediately in your browser without needing real SMTP credentials.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1">How to plug in live Gmail / SMTP:</h4>
              <p className="text-[11px] leading-relaxed">
                Add these variables in your backend hosting environment settings (Render / Railway / .env):
              </p>
              <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[10px] mt-2 space-y-1 overflow-x-auto">
                <p>SMTP_HOST=smtp.gmail.com</p>
                <p>SMTP_PORT=587</p>
                <p>SMTP_USER=your-email@gmail.com</p>
                <p>SMTP_PASS=your-app-password</p>
                <p>ADMIN_EMAIL=admin@hatsun.com</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Dispatched Emails Archive */}
      <Card>
        <CardHeader
          title="Recent Email Dispatches"
          subtitle="Click on any record to view the live HTML email preview"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Live Preview</th>
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
                    {item.previewUrl ? (
                      <a
                        href={item.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span>View HTML</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">SMTP Direct</span>
                    )}
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
