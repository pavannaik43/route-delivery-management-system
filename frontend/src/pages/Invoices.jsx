import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInvoicesApi, getInvoiceByIdApi } from '../api/endpoints';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { InvoiceModal } from '../components/invoice/InvoiceModal';
import {
  FileText,
  Search,
  Calendar,
  Printer,
  Download,
  Store,
  IndianRupee,
  Receipt,
  ArrowUpRight
} from 'lucide-react';

export const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', selectedDate, searchTerm],
    queryFn: () => getInvoicesApi({
      date: selectedDate || undefined,
      search: searchTerm || undefined
    })
  });

  const invoices = data?.invoices || [];

  const handleOpenInvoice = async (deliveryId) => {
    try {
      const res = await getInvoiceByIdApi(deliveryId);
      if (res.success && res.invoice) {
        setSelectedInvoice(res.invoice);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const totalUnits = invoices.reduce((sum, inv) => sum + (Number(inv.total_units) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tax Invoices Directory (M8)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generated GST tax invoices, delivery challans, and print & PDF archive
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-500"
            >
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Invoices</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{invoices.length}</p>
          <span className="text-[11px] text-slate-400">Total generated records</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Invoiced Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1.5">
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">Total value dispatched</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Dispatched Units</span>
            <FileText className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-black text-primary mt-1.5">{totalUnits}</p>
          <span className="text-[11px] text-slate-400">Total physical SKUs</span>
        </div>
      </div>

      {/* Search and Table */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Generated Invoices"
          subtitle="Click on any invoice to view, print, or download PDF"
          action={
            <div className="w-64">
              <Input
                placeholder="Search invoice # or shop..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-1 text-xs"
              />
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Retailer Store</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 text-center">Items / Units</th>
                <th className="py-3 px-4">Delivered By</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading invoices archive...
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.delivery_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-primary">
                      {inv.invoice_no}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.delivery_date}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{inv.shop_name}</span>
                      {inv.owner_name && <span className="text-[10px] text-slate-400">Prop: {inv.owner_name}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.route || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-800">
                        {inv.total_items} items ({inv.total_units} units)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.delivered_by_username || 'Staff'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      ₹{Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenInvoice(inv.delivery_id)}
                        className="py-1 px-2.5 text-xs text-primary bg-blue-50/50 hover:bg-blue-100"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        View / Print
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
