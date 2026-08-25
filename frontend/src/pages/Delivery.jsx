import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getShopsApi, getStockApi, createDeliveryApi, getInvoiceByIdApi } from '../api/endpoints';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { InvoiceModal } from '../components/invoice/InvoiceModal';
import {
  PackageCheck,
  Store,
  Plus,
  Trash2,
  Boxes,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle2,
  Sparkles,
  MapPin,
  Phone
} from 'lucide-react';

export const Delivery = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const todayStr = new Date().toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState(todayStr);
  const [selectedRoute, setSelectedRoute] = useState('All');
  const [selectedShopId, setSelectedShopId] = useState(() => searchParams.get('shopId') || '');

  // Line items state: [{ productId, quantity, unitPrice }]
  const [lineItems, setLineItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const [formError, setFormError] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Fetch Shops
  const { data: shopsData, isLoading: isShopsLoading } = useQuery({
    queryKey: ['shops', selectedRoute],
    queryFn: () => getShopsApi({ route: selectedRoute === 'All' ? undefined : selectedRoute }),
  });

  // Fetch Live Stock
  const { data: stockData, isLoading: isStockLoading } = useQuery({
    queryKey: ['stock', deliveryDate],
    queryFn: () => getStockApi(deliveryDate),
    refetchInterval: 10000
  });

  const shops = shopsData?.shops || [];
  const routes = shopsData?.routes || [];
  const stockList = stockData?.stock || [];
  const stockMap = new Map(stockList.map(s => [s.productId, s]));

  // Selected shop object
  const selectedShop = shops.find(s => String(s.id) === String(selectedShopId));

  // Initialize shopId from URL param if present
  useEffect(() => {
    const shopIdParam = searchParams.get('shopId');
    if (shopIdParam) {
      setSelectedShopId(shopIdParam);
    }
  }, [searchParams]);

  // Handle Product Selection in Line Item
  const handleProductChange = (index, productId) => {
    const stockInfo = stockMap.get(Number(productId));
    const newItems = [...lineItems];
    newItems[index] = {
      ...newItems[index],
      productId: Number(productId),
      unitPrice: stockInfo ? stockInfo.retailPrice : 0,
      quantity: 1
    };
    setLineItems(newItems);
  };

  // Handle Qty change
  const handleQtyChange = (index, qty) => {
    const num = qty === '' ? '' : Math.max(1, parseInt(qty, 10) || 1);
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], quantity: num };
    setLineItems(newItems);
  };

  // Handle Unit Price override
  const handlePriceChange = (index, price) => {
    const num = price === '' ? '' : Math.max(0, parseFloat(price) || 0);
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], unitPrice: num };
    setLineItems(newItems);
  };

  // Add line item
  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  // Remove line item
  const handleRemoveLineItem = (index) => {
    if (lineItems.length === 1) {
      setLineItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    } else {
      setLineItems(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  // Delivery Mutation
  const deliveryMutation = useMutation({
    mutationFn: createDeliveryApi,
    onSuccess: async (res) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardToday'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });

      // Fetch the full populated invoice for preview
      try {
        const invRes = await getInvoiceByIdApi(res.delivery.deliveryId);
        if (invRes.success && invRes.invoice) {
          setCompletedInvoice(invRes.invoice);
        } else {
          setCompletedInvoice(res.delivery);
        }
      } catch {
        setCompletedInvoice(res.delivery);
      }

      setIsInvoiceModalOpen(true);

      // Reset delivery form
      setLineItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || err.message || 'Delivery recording failed.');
    }
  });

  // Form Submit
  const handleSubmitDelivery = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedShopId) {
      setFormError('Please select a retail shop.');
      return;
    }

    const validItems = lineItems.filter(item => item.productId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setFormError('Please select at least one product with quantity > 0.');
      return;
    }

    // Client-side stock check for fast feedback
    for (const item of validItems) {
      const stock = stockMap.get(item.productId);
      if (!stock || stock.remainingStock <= 0) {
        setFormError(`"${stock?.productName || 'Product'}" is out of vehicle stock.`);
        return;
      }
      if (item.quantity > stock.remainingStock) {
        setFormError(
          `Insufficient vehicle stock for "${stock.productName}". Available: ${stock.remainingStock}, Requested: ${item.quantity}.`
        );
        return;
      }
    }

    deliveryMutation.mutate({
      shopId: Number(selectedShopId),
      deliveryDate,
      items: validItems.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice)
      }))
    });
  };

  // Grand total calculation
  const grandTotal = lineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

  const totalUnits = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Record Shop Delivery & Invoicing (M6 & M8)</h2>
            <span className="text-[10px] font-bold text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              Atomic Transaction
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver stock to retail partner, auto-generate tax invoice, and decrement vehicle inventory immediately
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-slate-700">Date:</span>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="text-xs font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {formError && (
        <Alert
          type="danger"
          title="Delivery Error"
          message={formError}
          onClose={() => setFormError('')}
        />
      )}

      {/* Business Guarantee Callout */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 rounded-xl border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
          <span>
            <strong>ACID Guarantee:</strong> Stock availability check, delivery ledger insertion, and sequential tax invoice generation (<strong>INV-YYYYMMDD-####</strong>) execute atomically.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmitDelivery} className="space-y-6">
        {/* Step 1: Select Retail Shop Card */}
        <Card>
          <CardHeader
            title="Step 1: Select Retailer Shop & Route"
            subtitle="Choose the destination store for this delivery dispatch"
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Route Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Filter by Delivery Route
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => {
                    setSelectedRoute(e.target.value);
                    setSelectedShopId('');
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="All">All Routes</option>
                  {routes.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Shop Select Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Retailer Store *
                </label>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-medium"
                >
                  <option value="">-- Choose Retailer Shop --</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.shop_name} ({s.route || 'General'}) {s.owner_name ? `— Prop: ${s.owner_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Shop Details Preview Card */}
            {selectedShop && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedShop.shop_name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-1 text-[11px]">
                    {selectedShop.owner_name && <span>Prop: <strong>{selectedShop.owner_name}</strong></span>}
                    {selectedShop.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedShop.phone}
                      </span>
                    )}
                    {selectedShop.address && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" /> {selectedShop.address}
                      </span>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full text-xs">
                  {selectedShop.route || 'Assigned Route'}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Step 2: Line Items */}
        <Card>
          <CardHeader
            title="Step 2: Add Product Line Items"
            subtitle="Select products, enter quantities, and verify live vehicle stock balance"
            action={
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddLineItem}
                className="text-xs bg-slate-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Line Item
              </Button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3 min-w-[220px]">Product Selection</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Vehicle Stock</th>
                  <th className="py-3 px-3 text-center w-28">Quantity</th>
                  <th className="py-3 px-3 text-right w-28">Rate (₹)</th>
                  <th className="py-3 px-3 text-right w-32">Subtotal (₹)</th>
                  <th className="py-3 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item, idx) => {
                  const stockInfo = stockMap.get(Number(item.productId));
                  const availableStock = stockInfo ? stockInfo.remainingStock : 0;
                  const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  const isExceeding = item.productId && Number(item.quantity) > availableStock;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isExceeding ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Product Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          required
                          className="w-full text-xs font-semibold text-slate-900 rounded-lg border border-slate-300 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option value="">-- Choose Product --</option>
                          {stockList.map((prod) => (
                            <option
                              key={prod.productId}
                              value={prod.productId}
                              disabled={prod.remainingStock <= 0}
                            >
                              {prod.productName} ({prod.size}) — {prod.remainingStock} on truck — ₹{prod.retailPrice}
                            </option>
                          ))}
                        </select>
                        {stockInfo && (
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Category: {stockInfo.category} | MRP: ₹{stockInfo.mrp}
                          </span>
                        )}
                      </td>

                      {/* Remaining Vehicle Stock Badge */}
                      <td className="py-3 px-3 text-center">
                        {item.productId ? (
                          <Badge variant={stockInfo?.stockStatus || 'neutral'}>
                            {availableStock} left
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Quantity Input */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max={availableStock > 0 ? availableStock : 1}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          required
                          className={`w-20 text-center py-1 px-2 border rounded-lg text-xs font-bold ${
                            isExceeding
                              ? 'border-red-500 text-red-700 bg-red-50 focus:ring-red-200'
                              : 'border-slate-300 text-slate-900 focus:ring-primary/20'
                          } focus:outline-none focus:ring-2`}
                        />
                        {isExceeding && (
                          <span className="text-[10px] text-red-600 font-bold block mt-0.5">
                            Max: {availableStock}
                          </span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(idx, e.target.value)}
                          required
                          className="w-24 text-right py-1 px-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-sm">
                        ₹{itemSubtotal.toFixed(2)}
                      </td>

                      {/* Remove */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Grand Total Footer */}
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/90">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Line Items</span>
                <p className="text-sm font-extrabold text-slate-800">{lineItems.filter(i => i.productId).length} items</p>
              </div>
              <div className="pl-6 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Units</span>
                <p className="text-sm font-extrabold text-slate-800">{totalUnits} units</p>
              </div>
              <div className="pl-6 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-primary">Invoice Grand Total</span>
                <p className="text-xl font-black text-primary">₹{grandTotal.toFixed(2)}</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              isLoading={deliveryMutation.isPending}
              disabled={!selectedShopId || grandTotal <= 0}
              className="w-full sm:w-auto font-bold shadow-md shadow-primary/30"
            >
              <PackageCheck className="w-5 h-5 mr-2" />
              Complete Delivery & Issue Invoice
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Auto Invoice Modal on Delivery Completion */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={completedInvoice}
      />
    </div>
  );
};
