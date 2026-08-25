import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { Plus, Search, Edit2, Trash2, Package, Check, Tag } from 'lucide-react';

const CATEGORIES = ['All', 'Milk', 'Curd', 'Ghee', 'Paneer', 'Butter', 'Ice Cream', 'Powder'];

export const Products = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Milk',
    size: '500ml',
    mrp: '',
    retail_price: '',
    image: '',
    status: 'active'
  });

  // Query products
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', selectedCategory, searchTerm],
    queryFn: () => getProductsApi({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      search: searchTerm || undefined
    })
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create product');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProductApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update product');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Milk',
      size: '500ml',
      mrp: '',
      retail_price: '',
      image: '',
      status: 'active'
    });
    setEditingProduct(null);
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      size: product.size,
      mrp: product.mrp,
      retail_price: product.retail_price,
      image: product.image || '',
      status: product.status
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mrp || !formData.retail_price) {
      setFormError('Please fill in name, MRP, and wholesale/retail price.');
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Are you sure you want to delete or deactivate "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const products = data?.products || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Products Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Master SKU directory, categories, pricing, and availability status
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Product
          </Button>
        )}
      </div>

      {/* Category Pills & Search Bar */}
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
                placeholder="Search products..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((prod) => {
            const margin = Math.max(0, Number(prod.mrp) - Number(prod.retail_price));
            const marginPct = prod.mrp > 0 ? Math.round((margin / prod.mrp) * 100) : 0;

            return (
              <Card key={prod.id} hover className="flex flex-col justify-between overflow-hidden">
                <div>
                  {/* Image Header */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden group">
                    <img
                      src={prod.image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <Badge variant={prod.status === 'active' ? 'active' : 'inactive'}>
                        {prod.status}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                      {prod.size}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {prod.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5 line-clamp-1">
                      {prod.name}
                    </h4>

                    {/* Price Breakdown */}
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Retail Rate</span>
                        <span className="text-sm font-bold text-slate-900">₹{Number(prod.retail_price).toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">MRP</span>
                        <span className="text-xs font-semibold text-slate-500 line-through">₹{Number(prod.mrp).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                      <span>Retailer Margin:</span>
                      <span className="font-bold">₹{margin.toFixed(2)} ({marginPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Admin Actions Footer */}
                {isAdmin && (
                  <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(prod)}
                      className="py-1 px-2.5 text-xs text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(prod)}
                      className="py-1 px-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto stroke-1 mb-2" />
          <h4 className="font-bold text-slate-700">No products found</h4>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different category or clear the search filter.</p>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Hatsun Agro Products SKU definition"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert type="danger" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Product Name *"
            placeholder="e.g. Arokya Full Cream Milk"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Milk">Milk</option>
              <option value="Curd">Curd</option>
              <option value="Ghee">Ghee</option>
              <option value="Paneer">Paneer</option>
              <option value="Butter">Butter</option>
              <option value="Ice Cream">Ice Cream</option>
              <option value="Powder">Powder</option>
              <option value="Beverage">Beverage</option>
            </Select>

            <Input
              label="Unit Size / Packaging *"
              placeholder="e.g. 500ml, 1kg, 200g"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="MRP (₹) *"
              type="number"
              step="0.5"
              placeholder="e.g. 35.00"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              required
            />

            <Input
              label="Retail / Wholesale Rate (₹) *"
              type="number"
              step="0.5"
              placeholder="e.g. 32.00"
              value={formData.retail_price}
              onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
              required
            />
          </div>

          <Input
            label="Image URL"
            placeholder="https://..."
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            helperText="Unsplash or direct image URL for product card preview"
          />

          <Select
            label="Availability Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active (Available for Loading & Delivery)</option>
            <option value="inactive">Inactive (Discontinued / Unavailable)</option>
          </Select>

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
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
