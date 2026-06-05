import { Router } from 'express'
import Order from '../models/Order.js'
import Customer from '../models/Customer.js'
import Product from '../models/Product.js'
import Activity from '../models/Activity.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/orders
router.get('/', async (req, res) => {
  const { search, status } = req.query
  const q = {}
  if (req.user.role === 'sales') {
    const myCustomers = await Customer.find({ assignedSalesId: req.user._id }).select('_id')
    q.customerId = { $in: myCustomers.map(c => c._id) }
  }
  if (status && status !== 'all') q.status = status
  if (search) {
    const rx = new RegExp(search, 'i')
    q.$or = [{ orderNumber: rx }, { customerName: rx }]
  }
  const list = await Order.find(q).sort({ createdAt: -1 })
  res.json(list.map(o => o.toJSON()))
})

// POST /api/orders
router.post('/', async (req, res) => {
  const { customerId, items, paymentMethod, notes, discount = 0 } = req.body
  if (!customerId || !items?.length) {
    return res.status(400).json({ error: 'customerId va items kerak' })
  }
  const customer = await Customer.findById(customerId)
  if (!customer) return res.status(404).json({ error: 'Mijoz topilmadi' })

  // Enrich items with product info + compute totals
  const enriched = []
  let subtotal = 0
  for (const it of items) {
    const p = await Product.findById(it.productId)
    if (!p) return res.status(404).json({ error: `Mahsulot topilmadi: ${it.productId}` })
    const line = {
      productId: p._id,
      productName: p.name,
      sku: p.sku,
      price: p.price,
      quantity: Number(it.quantity),
      total: p.price * Number(it.quantity),
    }
    enriched.push(line)
    subtotal += line.total

    // decrement stock
    p.stock = Math.max(0, p.stock - line.quantity)
    await p.save()
  }

  const total = subtotal - (discount || 0)
  const count = await Order.countDocuments()
  const orderNumber = `ORD-${10000 + count + 1}`

  const order = await Order.create({
    orderNumber,
    customerId: customer._id,
    customerName: customer.companyName,
    salesId: customer.assignedSalesId || req.user._id,
    items: enriched,
    subtotal,
    discount: discount || 0,
    total,
    paymentMethod: paymentMethod || 'Bank o\'tkazmasi',
    shippingAddress: customer.address,
    notes: notes || '',
    status: 'pending',
    paymentStatus: 'pending',
  })

  customer.totalSpent += total
  customer.orderCount += 1
  await customer.save()

  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `yangi buyurtma yaratdi: ${order.orderNumber}`,
  })

  res.status(201).json(order.toJSON())
})

// PATCH /api/orders/:id
router.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  const o = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!o) return res.status(404).json({ error: 'Topilmadi' })
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `buyurtma yangilandi: ${o.orderNumber}`,
  })
  res.json(o.toJSON())
})

// DELETE /api/orders/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const o = await Order.findByIdAndDelete(req.params.id)
  if (!o) return res.status(404).json({ error: 'Topilmadi' })
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `buyurtmani o'chirdi: ${o.orderNumber}`,
  })
  res.json({ ok: true })
})

export default router
