import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import {
  Users as UsersIcon,
  Plus,
  Shield,
  UserCheck,
  Edit2,
  Trash2,
  Lock,
  KeyRound
} from 'lucide-react';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'delivery_staff'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsersApi
  });

  const createMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUserApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      phone: '',
      role: 'delivery_staff'
    });
    setEditingUser(null);
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email || '',
      password: '',
      phone: u.phone || '',
      role: u.role
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- Username validation (create only, matches backend createUserSchema) ---
    if (!editingUser) {
      if (!formData.username) {
        setFormError('Username is required.');
        return;
      }
      if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
        setFormError('Username must be alphanumeric (letters and numbers only).');
        return;
      }
      if (formData.username.length < 3 || formData.username.length > 30) {
        setFormError('Username must be between 3 and 30 characters.');
        return;
      }
    }

    if (!formData.email) {
      setFormError('Email is required.');
      return;
    }

    if (!formData.phone) {
      setFormError('Phone is required.');
      return;
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setFormError('Phone must be exactly 10 digits.');
      return;
    }

    if (!editingUser) {
      if (!formData.password) {
        setFormError('Password is required for new users.');
        return;
      }
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters long.');
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setFormError('Password must contain at least one uppercase letter.');
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        setFormError('Password must contain at least one lowercase letter.');
        return;
      }
      if (!/\d/.test(formData.password)) {
        setFormError('Password must contain at least one digit.');
        return;
      }
      if (!/[!@$%*?&]/.test(formData.password)) {
        setFormError('Password must contain at least one special character (@$!%*?&).');
        return;
      }
    }

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          role: formData.role
        }
      });
    } else {
      createMutation.mutate({
        ...formData,
        phone: formData.phone.replace(/\D/g, '')
      });
    }
  };

  const handleDelete = (u) => {
    if (u.id === currentUser.id) {
      alert('You cannot delete your own active account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${u.username}"?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer system users, assign roles (Admin vs Delivery Staff), and reset passwords
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <CardHeader
          title="System Accounts"
          subtitle={`${users.length} registered accounts in the system`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role / Permissions</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const isAdmin = u.role === 'admin';

                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {u.username} {isCurrent && <span className="text-[10px] text-primary font-semibold">(You)</span>}
                          </span>
                          <span className="text-[10px] text-slate-400">ID: #{u.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isAdmin
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isAdmin ? (
                          <>
                            <Shield className="w-3 h-3 text-amber-600" />
                            System Administrator
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            Delivery Staff
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">{u.created_at || 'Pre-seeded'}</td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="py-1 px-2.5 text-xs text-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>

                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(u)}
                            className="py-1 px-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'}
        subtitle="Manage user access and credentials"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert type="danger" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Username *"
            placeholder="e.g. driver3 or manager"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={!!editingUser}
            required
          />

          <Input
            label="Email *"
            type="email"
            placeholder="e.g. driver3@hatsun.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone *"
            type="tel"
            placeholder="10 digits, e.g. 9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Select
            label="System Role *"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="delivery_staff">Delivery Staff (Loading, Field Delivery, Day Summary)</option>
            <option value="admin">Admin (Full System Access & Analytics)</option>
          </Select>

          <Input
            label={editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
            type="password"
            placeholder="Min 8 chars, upper+lower+digit+special"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
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
              {editingUser ? 'Save User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
