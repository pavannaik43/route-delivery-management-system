import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockApi, createLoadsApi, updateLoadApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import {
  Truck,
  Boxes,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit2,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Layers
} from 'lucide-react';

export const LoadVehicle = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState({});
  const [alertInfo, setAlertInfo] = useState(null);

  // Admin Edit Modal
  const [editItem, setEditItem] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch stock and current load for selected date
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock', selectedDate],
    queryFn: () => getStockApi(selectedDate),
  });

  const stockItems = data?.stock || [];

  // Create Loads Mutation
  const createLoadsMutation = useMutation({
    mutationFn: (payload) => createLoadsApi(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardToday'] });
      setAlertInfo({ type: 'success', message: res.message || 'Vehicle loaded successfully!' });
      setQuantities({});
    },
    onError: (err) => {
      setAlertInfo({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Failed to load vehicle.'
      });
    }
  });

  // Admin Update Load Mutation
  const updateLoadMutation = useMutation({
    mutationFn: ({ id, quantity }) => updateLoadApi(id, { quantity }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardToday'] });
      setIsEditModalOpen(false);
      setAlertInfo({ type: 'success', message: 'Vehicle load quantity updated successfully!' });
    },
    onError: (err) => {
      setAlertInfo({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Failed to update load quantity.'
      });
    }
  });

  const handleQtyChange = (productId, val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setQuantities(prev => ({ ...prev, [productId]: num }));
  };

  const handleApplyPreset = (multiplier = 1) => {
    const defaults = {
      'Milk': 100 * multiplier,
      'Curd': 60 * multiplier,
      'Paneer': 30 * multiplier,
      'Ghee': 20 * multiplier,
      'Butter': 25 * multiplier,
      'Ice Cream': 40 * multiplier,
      'Powder': 15 * multiplier
    };

    const newQuantities = {};
    stockItems.forEach(item => {
      if (item.loadedQuantity === 0) {
        newQuantities[item.productId] = defaults[item.category] || (20 * multiplier);
      }
    });
    setQuantities(newQuantities);
  };

  const handleLoadSubmit = (e) => {
    e.preventDefault();
    setAlertInfo(null);

    const itemsToLoad = Object.entries(quantities)
      .map(([prodId, qty]) => ({ product_id: Number(prodId), quantity: Number(qty) }))
      .filter(item => item.quantity > 0);

    if (itemsToLoad.length === 0) {
      setAlertInfo({ type: 'warning', message: 'Please enter a load quantity (> 0) for at least one product.' });
      return;
    }

    createLoadsMutation.mutate({
      load_date: selectedDate,
      items: itemsToLoad
    });
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditQty(item.loadedQuantity.toString());
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editItem || !editItem.loadId) return;

    updateLoadMutation.mutate({
      id: editItem.loadId,
      quantity: Number(editQty)
    });
  };

  // Calculations for summary stats
  const totalEnteredUnits = Object.values(quantities).reduce((sum, q) => sum + (Number(q) || 0), 0);
  const totalAlreadyLoaded = stockItems.reduce((sum, i) => sum + i.loadedQuantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vehicle Stock Loading (M5)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Morning depot dispatch: Load vehicle with products for today's delivery route
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-slate-700">Loading Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Alert Banner */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
          onClose={() => setAlertInfo(null)}
        />
      )}

      {/* Business Rule Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200/80 flex items-start gap-3 text-xs text-slate-700">
        <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-primary font-bold">Business Rule #1:</strong> Products can only be loaded onto a vehicle <strong>once per calendar day</strong>. Once loaded, existing load quantities can be modified by an <strong>Admin</strong> if adjustments are needed.
        </div>
      </div>

      {/* Load Action Controls Card */}
      <Card>
        <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Loaded Today</span>
              <p className="text-lg font-extrabold text-primary">{totalAlreadyLoaded} units</p>
            </div>
            {totalEnteredUnits > 0 && (
              <div className="pl-4 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Pending New Load</span>
                <p className="text-lg font-extrabold text-emerald-600">+{totalEnteredUnits} units</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset(1)}
              className="py-1 px-2.5 text-xs bg-slate-50"
            >
              Standard Fill
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset(1.5)}
              className="py-1 px-2.5 text-xs bg-slate-50"
            >
              Heavy Route (1.5x)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantities({})}
              className="py-1 px-2 text-xs text-slate-500"
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Loading Items Form */}
      <form onSubmit={handleLoadSubmit}>
        <Card className="overflow-hidden">
          <CardHeader
            title="Active Products Dispatch List"
            subtitle={`Inventory status for ${selectedDate}`}
            action={
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={createLoadsMutation.isPending}
                disabled={totalEnteredUnits === 0}
              >
                <Truck className="w-4 h-4 mr-1.5" />
                Confirm Vehicle Load ({totalEnteredUnits} units)
              </Button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4 text-center">Category</th>
                  <th className="py-3 px-4 text-center">Pack Size</th>
                  <th className="py-3 px-4 text-right">Wholesale Rate</th>
                  <th className="py-3 px-4 text-center">Loaded Today</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                  <th className="py-3 px-4 text-center w-40">Morning Load Qty</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Admin Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading stock items...
                    </td>
                  </tr>
                ) : stockItems.length > 0 ? (
                  stockItems.map((item) => {
                    const isAlreadyLoaded = item.loadedQuantity > 0;
                    const qtyValue = quantities[item.productId] !== undefined ? quantities[item.productId] : '';

                    return (
                      <tr
                        key={item.productId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isAlreadyLoaded ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Product info */}
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

                        {/* Loaded */}
                        <td className="py-3 px-4 text-center">
                          {isAlreadyLoaded ? (
                            <span className="font-bold text-primary bg-blue-100/80 px-2.5 py-1 rounded-full text-xs">
                              {item.loadedQuantity} units
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>

                        {/* Remaining */}
                        <td className="py-3 px-4 text-center">
                          <Badge variant={item.stockStatus}>
                            {item.remainingStock} units
                          </Badge>
                        </td>

                        {/* Qty Input */}
                        <td className="py-3 px-4 text-center">
                          {isAlreadyLoaded ? (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Already Loaded
                            </span>
                          ) : (
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={qtyValue}
                                onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                                className="w-24 text-center py-1 px-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </div>
                          )}
                        </td>

                        {/* Admin Edit */}
                        {isAdmin && (
                          <td className="py-3 px-4 text-center">
                            {isAlreadyLoaded ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(item)}
                                className="py-1 px-2 text-[11px] text-primary hover:bg-blue-50"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit Load
                              </Button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-400">
                      No active products available to load.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Entering quantities and clicking confirm creates the official vehicle load record for {selectedDate}.
            </p>

            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={createLoadsMutation.isPending}
              disabled={totalEnteredUnits === 0}
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Confirm Vehicle Load ({totalEnteredUnits} units)
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Admin Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Loaded Vehicle Stock (Admin)"
        subtitle={editItem?.productName}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Product:</span>
              <strong className="text-slate-800">{editItem?.productName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category & Pack:</span>
              <strong className="text-slate-800">{editItem?.category} ({editItem?.size})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Already Delivered Today:</span>
              <strong className="text-emerald-600">{editItem?.deliveredQuantity} units</strong>
            </div>
          </div>

          <Input
            label="Updated Total Loaded Quantity *"
            type="number"
            min={editItem?.deliveredQuantity || 0}
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            helperText={`Must be at least ${editItem?.deliveredQuantity || 0} units (already delivered).`}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={updateLoadMutation.isPending}
            >
              Save Updated Quantity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
