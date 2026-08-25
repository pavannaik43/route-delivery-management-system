import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStockApi } from '../api/endpoints';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  Boxes,
  Calendar,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Truck,
  PackageCheck
} from 'lucide-react';

const CATEGORIES = ['All', 'Milk', 'Curd', 'Ghee', 'Paneer', 'Butter', 'Ice Cream', 'Powder'];

export const Stock = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['stock', selectedDate],
    queryFn: () => getStockApi(selectedDate),
    refetchInterval: 10000 // live stock refresh every 10 seconds
  });

  const stockList = data?.stock || [];
  const summary = data?.summary || {};

  const filteredStock = stockList.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockItems = stockList.filter(s => s.stockStatus === 'low_stock' || s.stockStatus === 'out_of_stock');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Vehicle Stock Status (M7)</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Computed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time vehicle inventory balance (Loaded − Delivered = Remaining Stock)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
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
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && (
        <Alert
          type="warning"
          title={`Low Vehicle Stock Warning (${lowStockItems.length} Products)`}
          message={`Action required: Vehicle stock is nearly exhausted for ${lowStockItems.map(i => `${i.productName} (${i.remainingStock} units left)`).join(', ')}.`}
        />
      )}

      {/* Stock Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Loaded on Vehicle</span>
            <div className="p-2 rounded-lg bg-blue-50 text-primary">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary.totalLoaded || 0}</p>
          <span className="text-[11px] text-slate-400">Total units loaded today</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Delivered to Shops</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{summary.totalDelivered || 0}</p>
          <span className="text-[11px] text-slate-400">Units successfully delivered</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Remaining on Vehicle</span>
            <div className="p-2 rounded-lg bg-sky-50 text-secondary">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-primary mt-2">{summary.totalRemaining || 0}</p>
          <span className="text-[11px] text-slate-400">Available for next deliveries</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Low Stock Alerts</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{summary.lowStockCount || 0}</p>
          <span className="text-[11px] text-slate-400">SKUs below safe threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search stock..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stock Table */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Vehicle Inventory Manifest"
          subtitle={`Live stock decrements automatically updated after every saved delivery`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Category</th>
                <th className="py-3 px-4 text-center">Size</th>
                <th className="py-3 px-4 text-right">Retail Rate</th>
                <th className="py-3 px-4 text-center">Loaded</th>
                <th className="py-3 px-4 text-center">Delivered</th>
                <th className="py-3 px-4 text-center">Remaining Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 w-32">Depletion Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Calculating real-time stock balance...
                  </td>
                </tr>
              ) : filteredStock.length > 0 ? (
                filteredStock.map((item) => {
                  const percentDelivered = item.loadedQuantity > 0
                    ? Math.min(100, Math.round((item.deliveredQuantity / item.loadedQuantity) * 100))
                    : 0;

                  return (
                    <tr
                      key={item.productId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.stockStatus === 'low_stock' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80'}
                            alt={item.productName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-slate-400">MRP: ₹{item.mrp}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-medium text-slate-600">
                        {item.category}
                      </td>

                      <td className="py-3 px-4 text-center font-medium text-slate-600">
                        {item.size}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        ₹{Number(item.retailPrice).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {item.loadedQuantity}
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                        {item.deliveredQuantity}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-sm text-primary">
                          {item.remainingStock}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={item.stockStatus}>
                          {item.stockStatus === 'not_loaded'
                            ? 'Not Loaded'
                            : item.stockStatus === 'out_of_stock'
                            ? 'Out of Stock'
                            : item.stockStatus === 'low_stock'
                            ? 'Low Stock'
                            : 'In Stock'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentDelivered === 100
                                  ? 'bg-rose-500'
                                  : percentDelivered > 75
                                  ? 'bg-amber-500'
                                  : 'bg-primary'
                              }`}
                              style={{ width: `${percentDelivered}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>{percentDelivered}% delivered</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching stock items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
