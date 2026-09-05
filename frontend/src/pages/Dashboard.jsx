import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { getDashboardTodayApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { InvoiceModal } from '../components/invoice/InvoiceModal';
import { getInvoiceByIdApi } from '../api/endpoints';
import {
  IndianRupee,
  Truck,
  PackageCheck,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Store,
  FileText,
  CalendarCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#005BAC', '#0077CC', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'];

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return <Navigate to="/deliver" replace />;
  }

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardToday'],
    queryFn: getDashboardTodayApi,
    refetchInterval: 15000 // auto-refresh every 15s for live dispatch tracking
  });

  const handleViewInvoice = async (deliveryId) => {
    try {
      const res = await getInvoiceByIdApi(deliveryId);
      if (res.success && res.invoice) {
        setSelectedInvoice(res.invoice);
        setIsInvoiceModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Fetching real-time dispatch dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="danger"
        title="Error loading dashboard"
        message={error.message || 'Could not connect to backend server.'}
      />
    );
  }

  const kpis = data?.kpis || {};
  const categorySales = data?.categorySales || [];
  const routeProgress = data?.routeProgress || [];
  const recentDeliveries = data?.recentDeliveries || [];
  const lowStockAlerts = data?.lowStockAlerts || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Header */}
      <div className="bg-gradient-to-r from-primary via-[#0066c0] to-secondary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-sm">
                Live Daily Dispatch
              </span>
              <span className="text-xs text-sky-200">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1">
              Welcome, {user?.username}! 👋
            </h2>
            <p className="text-xs text-sky-100 mt-1 max-w-xl">
              Real-time route delivery monitor, vehicle stock decrementation, and invoice generation hub.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/load')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Load Vehicle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/deliver')}
              className="bg-white text-primary hover:bg-sky-50 font-bold border-transparent shadow-md"
            >
              <PackageCheck className="w-4 h-4 mr-1.5 text-primary" />
              New Delivery
            </Button>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockAlerts.length > 0 && (
        <Alert
          type="warning"
          title={`Low Vehicle Stock Alert (${lowStockAlerts.length} Products)`}
          message={`Remaining vehicle stock is low for: ${lowStockAlerts.map(p => `${p.productName} (${p.remainingStock} left)`).join(', ')}.`}
        />
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`₹${kpis.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${kpis.totalDeliveries} completed deliveries`}
          icon={IndianRupee}
          color="primary"
        />

        <StatCard
          title="Deliveries Completed"
          value={kpis.totalDeliveries}
          subtitle={`${kpis.totalUnitsDelivered} units dispatched`}
          icon={PackageCheck}
          color="success"
        />

        <StatCard
          title="Vehicle Stock Balance"
          value={`${kpis.totalRemaining} units`}
          subtitle={`Loaded: ${kpis.totalLoaded} units`}
          icon={Boxes}
          color="secondary"
        />

        <StatCard
          title="Vehicle Stock Clearance"
          value={`${kpis.stockUtilizationPercent}%`}
          subtitle={kpis.topProduct?.product_name ? `Top: ${kpis.topProduct.product_name}` : 'No sales yet'}
          icon={TrendingUp}
          color="warning"
        />
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/load')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-card-hover transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2 group-hover:text-primary">1. Load Stock</h4>
          <p className="text-[11px] text-slate-500">Morning vehicle loading</p>
        </button>

        <button
          onClick={() => navigate('/deliver')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-secondary hover:shadow-card-hover transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <PackageCheck className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2 group-hover:text-secondary">2. Deliver Products</h4>
          <p className="text-[11px] text-slate-500">Auto invoice & stock drop</p>
        </button>

        <button
          onClick={() => navigate('/stock')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-card-hover transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Boxes className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2 group-hover:text-emerald-600">3. Live Stock</h4>
          <p className="text-[11px] text-slate-500">Remaining on vehicle</p>
        </button>

        <button
          onClick={() => navigate('/summary')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-600 hover:shadow-card-hover transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2 group-hover:text-purple-600">4. Day Summary</h4>
          <p className="text-[11px] text-slate-500">EOD cash & stock return</p>
        </button>
      </div>

      {/* Analytics & Route Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category-wise Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's Category Revenue Breakdown"
            subtitle="Real-time sales value per product category"
          />
          <CardBody>
            {categorySales.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySales} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                    />
                    <Bar dataKey="total_revenue" fill="#005BAC" radius={[4, 4, 0, 0]}>
                      {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <PackageCheck className="w-10 h-10 stroke-1 mb-2" />
                <p className="text-xs">No delivery sales recorded yet today.</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Route Progress Tracker */}
        <Card>
          <CardHeader
            title="Route Delivery Progress"
            subtitle="Retail shops visited per route"
          />
          <CardBody className="space-y-4">
            {routeProgress.map((rp, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{rp.route}</span>
                  <span>
                    {rp.deliveredShops} / {rp.totalShops} shops ({rp.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rp.percentage === 100
                        ? 'bg-emerald-500'
                        : rp.percentage > 0
                        ? 'bg-primary'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${rp.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Top Seller Capsule */}
            {kpis.topProduct && kpis.topProduct.product_name !== 'None' && (
              <div className="mt-4 pt-4 border-t border-slate-100 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Top Selling Product Today</span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 mt-1">
                  {kpis.topProduct.product_name}
                </p>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Quantity Sold: <strong>{kpis.topProduct.total_qty_sold} units</strong></span>
                  <span>Value: <strong>₹{Number(kpis.topProduct.total_sales_value).toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Deliveries Table */}
      <Card>
        <CardHeader
          title="Recent Deliveries Today"
          subtitle="Auto-invoiced transactions with real-time stock decrements"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/invoices')}
            >
              View All Invoices
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Retailer Shop</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Delivered By</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDeliveries.length > 0 ? (
                recentDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-primary">
                      {del.invoice_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {del.shop_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{del.route || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{del.delivered_by || 'Staff'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{Number(del.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(del.id)}
                        className="py-1 px-2.5 text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-primary" />
                        Invoice
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No deliveries performed today yet. Click <strong>"New Delivery"</strong> to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Modal Preview */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
