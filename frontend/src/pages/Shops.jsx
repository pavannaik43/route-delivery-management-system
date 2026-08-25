import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getShopsApi, getShopByIdApi, createShopApi, updateShopApi, deleteShopApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import {
  Store,
  Plus,
  Search,
  Phone,
  MapPin,
  User,
  Navigation,
  Edit2,
  Trash2,
  History,
  PackageCheck,
  FileText
} from 'lucide-react';

export const Shops = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRoute, setSelectedRoute] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formError, setFormError] = useState('');

  // Shop History State
  const [historyShop, setHistoryShop] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    address: '',
    route: 'Route 1 - Anna Nagar'
  });

  // Query Shops
  const { data, isLoading, error } = useQuery({
    queryKey: ['shops', selectedRoute, searchTerm],
    queryFn: () => getShopsApi({
      route: selectedRoute === 'All' ? undefined : selectedRoute,
      search: searchTerm || undefined
    })
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createShopApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create shop');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateShopApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update shop');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteShopApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete shop');
    }
  });

  const resetForm = () => {
    setFormData({
      shop_name: '',
      owner_name: '',
      phone: '',
      address: '',
      route: 'Route 1 - Anna Nagar'
    });
    setEditingShop(null);
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      shop_name: shop.shop_name,
      owner_name: shop.owner_name || '',
      phone: shop.phone || '',
      address: shop.address || '',
      route: shop.route || 'Route 1 - Anna Nagar'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleViewHistory = async (shop) => {
    try {
      const res = await getShopByIdApi(shop.id);
      if (res.success && res.shop) {
        setHistoryShop(res.shop);
        setIsHistoryModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load shop history:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.shop_name) {
      setFormError('Shop name is required.');
      return;
    }

    if (editingShop) {
      updateMutation.mutate({ id: editingShop.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (shop) => {
    if (window.confirm(`Are you sure you want to delete "${shop.shop_name}"?`)) {
      deleteMutation.mutate(shop.id);
    }
  };

  const shops = data?.shops || [];
  const routes = data?.routes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Retailers & Delivery Routes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage partner retail shops, contact details, and assigned delivery routes
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Retailer
          </Button>
        )}
      </div>

      {/* Route Filter Tabs & Search */}
      <Card>
        <CardBody className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Route Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedRoute('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedRoute === 'All'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Routes ({shops.length})
              </button>
              {routes.map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setSelectedRoute(rt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedRoute === rt
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search shops or owners..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Shops Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : shops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <Card key={shop.id} hover className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                      <Navigation className="w-3 h-3 text-sky-500" />
                      {shop.route || 'General Route'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2 leading-tight">
                      {shop.shop_name}
                    </h3>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {shop.owner_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Owner: <strong className="text-slate-800">{shop.owner_name}</strong></span>
                    </div>
                  )}

                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`tel:${shop.phone}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {shop.phone}
                      </a>
                    </div>
                  )}

                  {shop.address && (
                    <div className="flex items-start gap-2 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-slate-500 line-clamp-2">{shop.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/deliver?shopId=${shop.id}`)}
                  className="text-xs"
                >
                  <PackageCheck className="w-3.5 h-3.5 mr-1" />
                  Deliver
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory(shop)}
                    title="View Past Invoices"
                    className="py-1 px-2 text-xs"
                  >
                    <History className="w-3.5 h-3.5 text-slate-600" />
                  </Button>

                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(shop)}
                        className="py-1 px-2 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(shop)}
                        className="py-1 px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Store className="w-12 h-12 mx-auto stroke-1 mb-2" />
          <h4 className="font-bold text-slate-700">No retailers found</h4>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different route or add a new retailer.</p>
        </div>
      )}

      {/* Add / Edit Shop Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShop ? 'Edit Retailer' : 'Add New Retailer'}
        subtitle="Route and shop information"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert type="danger" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Shop Name *"
            placeholder="e.g. Sri Krishna Dairy & Sweets"
            value={formData.shop_name}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Owner / Contact Person"
              placeholder="e.g. S. Sundaram"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            />

            <Input
              label="Phone Number"
              placeholder="e.g. +91 98401 23456"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Select
            label="Assigned Delivery Route"
            value={formData.route}
            onChange={(e) => setFormData({ ...formData, route: e.target.value })}
          >
            <option value="Route 1 - Anna Nagar">Route 1 - Anna Nagar</option>
            <option value="Route 2 - T Nagar">Route 2 - T Nagar</option>
            <option value="Route 3 - Velachery">Route 3 - Velachery</option>
            <option value="Route 4 - Adyar & OMR">Route 4 - Adyar & OMR</option>
            <option value="Route 5 - Tambaram & Chromepet">Route 5 - Tambaram & Chromepet</option>
          </Select>

          <Input
            label="Full Address"
            placeholder="Shop No., Street, Landmark, Area, Chennai"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingShop ? 'Save Changes' : 'Create Shop'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Shop Delivery History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`${historyShop?.shop_name} — Delivery History`}
        subtitle={`Route: ${historyShop?.route || 'General'}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Delivered By</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyShop?.deliveries && historyShop.deliveries.length > 0 ? (
                  historyShop.deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-primary">{del.invoice_no}</td>
                      <td className="py-2.5 px-3 text-slate-600">{del.delivery_date}</td>
                      <td className="py-2.5 px-3 text-slate-600">{del.delivered_by_user || 'Staff'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{Number(del.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No previous delivery records for this retailer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
