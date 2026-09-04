import api from './client';

// Health check
export const checkHealthApi = () => api.get('/health').then(res => res.data);

// Auth
export const loginApi = (credentials) => api.post('/auth/login', credentials).then(res => res.data);
export const getMeApi = () => api.get('/auth/me').then(res => res.data);
export const logoutApi = () => api.post('/auth/logout').then(res => res.data);
export const changePasswordApi = (data) => api.post('/auth/change-password', data).then(res => res.data);


// Products
export const getProductsApi = (params) => api.get('/products', { params }).then(res => res.data);
export const getProductByIdApi = (id) => api.get(`/products/${id}`).then(res => res.data);
export const createProductApi = (data) => api.post('/products', data).then(res => res.data);
export const updateProductApi = (id, data) => api.put(`/products/${id}`, data).then(res => res.data);
export const deleteProductApi = (id) => api.delete(`/products/${id}`).then(res => res.data);

// Shops
export const getShopsApi = (params) => api.get('/shops', { params }).then(res => res.data);
export const getShopByIdApi = (id) => api.get(`/shops/${id}`).then(res => res.data);
export const createShopApi = (data) => api.post('/shops', data).then(res => res.data);
export const updateShopApi = (id, data) => api.put(`/shops/${id}`, data).then(res => res.data);
export const deleteShopApi = (id) => api.delete(`/shops/${id}`).then(res => res.data);

// Vehicle Loads
export const getLoadsApi = (date) => api.get('/loads', { params: { date } }).then(res => res.data);
export const createLoadsApi = (data) => api.post('/loads', data).then(res => res.data);
export const updateLoadApi = (id, data) => api.put(`/loads/${id}`, data).then(res => res.data);

// Stock
export const getStockApi = (date) => api.get('/stock', { params: { date } }).then(res => res.data);

// Deliveries
export const getDeliveriesApi = (params) => api.get('/deliveries', { params }).then(res => res.data);
export const getDeliveryByIdApi = (id) => api.get(`/deliveries/${id}`).then(res => res.data);
export const createDeliveryApi = (data) => api.post('/deliveries', data).then(res => res.data);

// Invoices
export const getInvoicesApi = (params) => api.get('/invoices', { params }).then(res => res.data);
export const getInvoiceByIdApi = (deliveryId) => api.get(`/invoices/${deliveryId}`).then(res => res.data);

// Dashboard
export const getDashboardTodayApi = () => api.get('/dashboard/today').then(res => res.data);

// Day Summary
export const getDaySummaryApi = (date) => api.get('/summary/day', { params: { date } }).then(res => res.data);

// Reports
export const getDailyReportApi = (params) => api.get('/reports/daily', { params }).then(res => res.data);
export const getMonthlyReportApi = (params) => api.get('/reports/monthly', { params }).then(res => res.data);
export const getProductReportApi = (params) => api.get('/reports/products', { params }).then(res => res.data);
export const getShopReportApi = (params) => api.get('/reports/shops', { params }).then(res => res.data);

// Users
export const getUsersApi = () => api.get('/users').then(res => res.data);
export const createUserApi = (data) => api.post('/users', data).then(res => res.data);
export const updateUserApi = (id, data) => api.put(`/users/${id}`, data).then(res => res.data);
export const deleteUserApi = (id) => api.delete(`/users/${id}`).then(res => res.data);
