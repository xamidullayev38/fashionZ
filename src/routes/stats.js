import { Router } from 'express'
import Order from '../models/Order.js'
import Customer from '../models/Customer.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/stats/overview
router.get('/overview', async (req, res) => {
  // Scope to sales user if applicable
  const customerFilter = req.user.role === 'sales' ? { assignedSalesId: req.user._id } : {}
  const customers = await Customer.find(customerFilter).select('_id')
  const customerIds = customers.map(c => c._id)
  const orderFilter = req.user.role === 'sales' ? { customerId: { $in: customerIds } } : {}

  const [
    totalOrders,
    deliveredAgg,
    pendingCount,
    customerCount,
    productCount,
    userCount,
    lowStockCount,
  ] = await Promise.all([
    Order.countDocuments(orderFilter),
    Order.aggregate([
      { $match: { ...orderFilter, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ ...orderFilter, status: 'pending' }),
    Customer.countDocuments(customerFilter),
    Product.countDocuments(),
    User.countDocuments(),
    Product.countDocuments({ $expr: { $lt: ['$stock', '$minStock'] } }),
  ])

  res.json({
    revenue: deliveredAgg[0]?.total || 0,
    orderCount: totalOrders,
    pending: pendingCount,
    customerCount,
    productCount,
    userCount,
    lowStock: lowStockCount,
  })
})

// GET /api/stats/monthly?months=8
router.get('/monthly', async (req, res) => {
  const months = Math.min(24, parseInt(req.query.months) || 8)
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)

  const customerFilter = req.user.role === 'sales' ? { assignedSalesId: req.user._id } : {}
  const customers = await Customer.find(customerFilter).select('_id')
  const customerIds = customers.map(c => c._id)
  const match = {
    status: { $ne: 'cancelled' },
    createdAt: { $gte: cutoff },
    ...(req.user.role === 'sales' ? { customerId: { $in: customerIds } } : {}),
  }

  const result = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ])

  res.json(result.map(r => ({
    month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
    revenue: r.revenue,
    orders:  r.orders,
  })))
})

// GET /api/stats/status-breakdown
router.get('/status-breakdown', async (req, res) => {
  const filter = req.user.role === 'sales'
    ? { customerId: { $in: (await Customer.find({ assignedSalesId: req.user._id }).select('_id')).map(c => c._id) } }
    : {}
  const result = await Order.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  res.json(result.map(r => ({ status: r._id, count: r.count })))
})

// GET /api/stats/top-products
router.get('/top-products', async (req, res) => {
  const filter = { status: { $ne: 'cancelled' } }
  if (req.user.role === 'sales') {
    const ids = (await Customer.find({ assignedSalesId: req.user._id }).select('_id')).map(c => c._id)
    filter.customerId = { $in: ids }
  }
  const result = await Order.aggregate([
    { $match: filter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.productName' },
        qty:  { $sum: '$items.quantity' },
        total:{ $sum: '$items.total' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ])
  res.json(result.map(r => ({ productId: r._id, name: r.name, qty: r.qty, total: r.total })))
})

// GET /api/stats/by-category — for reports
router.get('/by-category', async (_req, res) => {
  const result = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products', localField: 'items.productId', foreignField: '_id', as: 'p',
      },
    },
    { $unwind: '$p' },
    {
      $group: {
        _id: '$p.categoryName',
        revenue: { $sum: '$items.total' },
        qty: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ])
  res.json(result.map(r => ({ category: r._id, revenue: r.revenue, qty: r.qty })))
})

// GET /api/stats/by-city
router.get('/by-city', async (_req, res) => {
  const result = await Customer.aggregate([
    { $group: { _id: '$city', total: { $sum: '$totalSpent' } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ])
  res.json(result.map(r => ({ city: r._id, total: r.total })))
})

// GET /api/stats/top-sales — top salesperson by revenue
router.get('/top-sales', async (_req, res) => {
  const result = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    {
      $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'c' },
    },
    { $unwind: '$c' },
    {
      $lookup: { from: 'users', localField: 'c.assignedSalesId', foreignField: '_id', as: 'u' },
    },
    { $unwind: '$u' },
    {
      $group: { _id: '$u._id', name: { $first: '$u.name' }, revenue: { $sum: '$total' }, orders: { $sum: 1 } },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ])
  res.json(result.map(r => ({ id: r._id, name: r.name, revenue: r.revenue, orders: r.orders })))
})

export default router
