import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDailyReportApi,
  getMonthlyReportApi,
  getProductReportApi,
  getShopReportApi
} from '../api/endpoints';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Package,
  Store,
  CalendarDays,
  FileSpreadsheet,
  IndianRupee
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#005BAC', '#0077CC', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedRoute, setSelectedRoute] = useState('');

  // Daily Query
  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: ['reportDaily', fromDate, toDate],
    queryFn: () => getDailyReportApi({ from: fromDate || undefined, to: toDate || undefined }),
    enabled: activeTab === 'daily'
  });

  // Monthly Query
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['reportMonthly', selectedYear],
    queryFn: () => getMonthlyReportApi({ year: selectedYear }),
    enabled: activeTab === 'monthly'
  });

  // Product Query
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ['reportProduct', fromDate, toDate],
    queryFn: () => getProductReportApi({ from: fromDate || undefined, to: toDate || undefined }),
    enabled: activeTab === 'products'
  });

  // Shop Query
  const { data: shopData, isLoading: isShopLoading } = useQuery({
    queryKey: ['reportShop', fromDate, toDate, selectedRoute],
    queryFn: () => getShopReportApi({
      from: fromDate || undefined,
      to: toDate || undefined,
      route: selectedRoute || undefined
    }),
    enabled: activeTab === 'shops'
  });

  const exportToCSV = (rows, filename) => {
    if (!rows || rows.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map(row => Object.values(row).map(v => `"${v !== null && v !== undefined ? v : ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'daily', label: 'Daily Trends', icon: CalendarDays },
    { id: 'monthly', label: 'Monthly Sales', icon: BarChart3 },
    { id: 'products', label: 'Product Performance', icon: Package },
    { id: 'shops', label: 'Retailer Rankings', icon: Store }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics & Reports Hub (M10)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Business performance analytics, revenue graphs, and CSV export for admin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'monthly' ? (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
              <span className="font-semibold text-slate-600">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="font-medium text-slate-700 bg-transparent focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="font-medium text-slate-700 bg-transparent focus:outline-none"
              />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="text-slate-400 hover:text-slate-700 text-xs ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'daily') exportToCSV(dailyData?.data, 'daily_sales_report');
              if (activeTab === 'monthly') exportToCSV(monthlyData?.data, 'monthly_sales_report');
              if (activeTab === 'products') exportToCSV(productData?.data, 'product_performance_report');
              if (activeTab === 'shops') exportToCSV(shopData?.data, 'retailer_ranking_report');
            }}
            className="bg-white"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. Daily Trends Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Daily Revenue Trend"
              subtitle="Total sales amount generated per day"
            />
            <CardBody>
              {isDailyLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : dailyData?.data && dailyData.data.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...dailyData.data].reverse()} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']} />
                      <Line
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#005BAC"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#005BAC' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                  No daily sales records found.
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Daily Summary Data" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Deliveries</th>
                    <th className="py-3 px-4 text-center">Shops Visited</th>
                    <th className="py-3 px-4 text-center">Units Sold</th>
                    <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyData?.data?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{row.date}</td>
                      <td className="py-3 px-4 text-center font-medium">{row.deliveries_count}</td>
                      <td className="py-3 px-4 text-center font-medium">{row.unique_shops_visited}</td>
                      <td className="py-3 px-4 text-center font-bold text-primary">{row.total_units_sold}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{Number(row.total_revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Monthly Performance Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={`Monthly Sales Breakdown (${selectedYear})`}
              subtitle="Monthly dispatch volume and revenue comparison"
            />
            <CardBody>
              {isMonthlyLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : monthlyData?.data && monthlyData.data.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData.data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="total_revenue" fill="#0077CC" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                  No monthly data recorded for {selectedYear}.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* 3. Product Performance Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Top Products by Revenue"
              subtitle="Sales contribution per product line"
            />
            <CardBody>
              {isProductLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : productData?.data && productData.data.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productData.data.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 80, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                      <YAxis dataKey="product_name" type="category" tick={{ fontSize: 10, fill: '#1E293B' }} width={120} />
                      <Tooltip formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]}>
                        {productData.data.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                  No product performance data available.
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="All Product SKUs Performance" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Category</th>
                    <th className="py-3 px-4 text-center">Size</th>
                    <th className="py-3 px-4 text-right">Retail Rate</th>
                    <th className="py-3 px-4 text-center">Units Sold</th>
                    <th className="py-3 px-4 text-right font-bold text-primary">Total Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productData?.data?.map((prod) => (
                    <tr key={prod.product_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{prod.product_name}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{prod.category}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{prod.size}</td>
                      <td className="py-3 px-4 text-right font-semibold">₹{Number(prod.retail_price).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{prod.total_units_sold}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{Number(prod.total_revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Retailer Rankings Tab */}
      {activeTab === 'shops' && (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader
              title="Retail Partner Rankings"
              subtitle="Purchasing volume and revenue leaderboard"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3 text-center w-8">Rank</th>
                    <th className="py-3 px-4">Retailer Store</th>
                    <th className="py-3 px-4">Owner / Contact</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4 text-center">Deliveries</th>
                    <th className="py-3 px-4 text-center">Units Purchased</th>
                    <th className="py-3 px-4">Last Order</th>
                    <th className="py-3 px-4 text-right font-bold text-primary">Total Spend (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shopData?.data?.map((shop, idx) => (
                    <tr key={shop.shop_id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-center font-black text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{shop.shop_name}</td>
                      <td className="py-3 px-4 text-slate-600">{shop.owner_name || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{shop.route || '-'}</td>
                      <td className="py-3 px-4 text-center font-semibold">{shop.total_deliveries}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{shop.total_units_purchased}</td>
                      <td className="py-3 px-4 text-slate-500">{shop.last_delivery_date || 'No orders yet'}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        ₹{Number(shop.total_revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
