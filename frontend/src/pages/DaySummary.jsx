import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDaySummaryApi, sendDaySummaryMailApi } from '../api/endpoints';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  CalendarCheck,
  Calendar,
  Printer,
  IndianRupee,
  PackageCheck,
  Boxes,
  TrendingUp,
  Store,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Mail,
  Check
} from 'lucide-react';

export const DaySummary = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailResult, setMailResult] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['daySummary', selectedDate],
    queryFn: () => getDaySummaryApi(selectedDate)
  });

  const totals = data?.totals || {};
  const topProduct = data?.topProduct;
  const reconciliation = data?.reconciliation || [];
  const shopsDelivered = data?.shopsDelivered || [];

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    try {
      setIsSendingMail(true);
      setMailResult(null);
      const res = await sendDaySummaryMailApi({ date: selectedDate });
      setMailResult({
        type: 'success',
        message: res.message || `Summary report for ${selectedDate} sent to admin successfully!`,
        previewUrl: res.previewUrl
      });
    } catch (err) {
      setMailResult({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Failed to dispatch summary email.'
      });
    } finally {
      setIsSendingMail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">End of Day (EOD) Summary (M9)</h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Settlement Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily route reconciliation, total sales revenue, and depot stock return manifest
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            isLoading={isSendingMail}
            className="border-primary/30 text-primary hover:bg-primary/5 font-semibold"
          >
            <Mail className="w-4 h-4 mr-1.5 text-primary" />
            Email Admin
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print EOD Sheet
          </Button>
        </div>
      </div>

      {/* Mail Alert Notification */}
      {mailResult && (
        <div className="no-print">
          <Alert
            type={mailResult.type}
            title={mailResult.type === 'success' ? 'Email Dispatched to Admin' : 'Email Dispatch Failed'}
            message={
              <div>
                <p>{mailResult.message}</p>
                {mailResult.previewUrl && (
                  <a
                    href={mailResult.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-700 underline hover:text-blue-900"
                  >
                    View Rendered HTML Email (Ethereal Preview) &rarr;
                  </a>
                )}
              </div>
            }
            onClose={() => setMailResult(null)}
          />
        </div>
      )}

      {/* Printable EOD Container */}
      <div id="printable-invoice" className="space-y-6">
        {/* Printable Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                Hatsun Agro Products RDMS
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1">Daily Route Settlement Sheet</h1>
            <p className="text-xs text-sky-100 mt-0.5">
              Settlement Date: <strong>{selectedDate}</strong> | Generated on {new Date().toLocaleTimeString()}
            </p>
          </div>

          <div className="text-left sm:text-right bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-sky-200 block">Total Revenue Collected</span>
            <p className="text-2xl font-black text-white">
              ₹{totals.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* EOD KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-bold text-slate-500 uppercase">Deliveries Made</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totals.totalDeliveries || 0}</p>
            <span className="text-[11px] text-slate-400">Avg ₹{totals.avgOrderValue || 0} / delivery</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-bold text-slate-500 uppercase">Units Dispatched</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totals.totalDeliveredUnits || 0}</p>
            <span className="text-[11px] text-slate-400">Sold value: ₹{totals.totalDeliveredValue?.toFixed(2)}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-bold text-slate-500 uppercase">Units Returned to Depot</span>
            <p className="text-2xl font-black text-primary mt-1">{totals.totalRemainingUnits || 0}</p>
            <span className="text-[11px] text-slate-400">Stock value: ₹{totals.totalRemainingValue?.toFixed(2)}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-bold text-slate-500 uppercase">Top Selling Product</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1 line-clamp-1">
              {topProduct?.product_name || 'No Sales'}
            </p>
            <span className="text-[11px] text-slate-500">
              {topProduct ? `${topProduct.total_qty_sold} units (₹${Number(topProduct.total_sales_value).toFixed(2)})` : '-'}
            </span>
          </div>
        </div>

        {/* Detailed Product Reconciliation Table */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Product Stock & Value Reconciliation"
            subtitle="Loaded vs Delivered vs Returned Physical Quantities and Revenue"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3 text-center">Category</th>
                  <th className="py-3 px-3 text-center">Pack</th>
                  <th className="py-3 px-3 text-right">Rate (₹)</th>
                  <th className="py-3 px-3 text-center">Loaded</th>
                  <th className="py-3 px-3 text-center">Delivered</th>
                  <th className="py-3 px-3 text-center font-bold text-primary">Remaining</th>
                  <th className="py-3 px-3 text-right font-bold text-emerald-700">Revenue (₹)</th>
                  <th className="py-3 px-3 text-right text-slate-500">Return Value (₹)</th>
                  <th className="py-3 px-3 text-center">Clearance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Computing day reconciliation...
                    </td>
                  </tr>
                ) : reconciliation.length > 0 ? (
                  reconciliation.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{item.productName}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{item.category}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{item.size}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">₹{item.retailPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{item.loadedQuantity}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{item.deliveredQuantity}</td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-primary">{item.remainingStock}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{item.valueSold.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">₹{item.valueRemaining.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.clearanceRate === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.clearanceRate > 0
                              ? 'bg-blue-100 text-primary'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.clearanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No stock data recorded for this date.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-bold bg-slate-50/90 text-slate-900">
                  <td colSpan={5} className="py-3 px-4 text-right">Settlement Totals:</td>
                  <td className="py-3 px-3 text-center">{totals.totalLoadedUnits}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-extrabold">{totals.totalDeliveredUnits}</td>
                  <td className="py-3 px-3 text-center text-primary font-extrabold">{totals.totalRemainingUnits}</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-black text-sm">
                    ₹{totals.totalDeliveredValue?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 font-bold">
                    ₹{totals.totalRemainingValue?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {totals.totalLoadedUnits > 0
                      ? `${Math.round((totals.totalDeliveredUnits / totals.totalLoadedUnits) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Retailers Visited List */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Delivered Retailers Manifest"
            subtitle={`All ${shopsDelivered.length} shops serviced on ${selectedDate}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Retailer Store</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-center">Units Delivered</th>
                  <th className="py-3 px-4 text-right">Invoice Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shopsDelivered.length > 0 ? (
                  shopsDelivered.map((shop) => (
                    <tr key={shop.shop_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-primary">{shop.invoice_no}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{shop.shop_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{shop.route || '-'}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800">{shop.units_count} units</td>
                      <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">
                        ₹{Number(shop.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No deliveries recorded on this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* EOD Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-600">
          <div>
            <div className="border-b border-dashed border-slate-300 h-10 w-40 mx-auto"></div>
            <p className="mt-1 font-semibold">Delivery Driver</p>
          </div>
          <div>
            <div className="border-b border-dashed border-slate-300 h-10 w-40 mx-auto"></div>
            <p className="mt-1 font-semibold">Depot Stock Supervisor</p>
          </div>
          <div>
            <div className="border-b border-dashed border-slate-300 h-10 w-40 mx-auto"></div>
            <p className="mt-1 font-semibold">Accounts / Cashier</p>
          </div>
        </div>
      </div>
    </div>
  );
};
