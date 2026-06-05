import { Router } from 'express'
import Product from '../models/Product.js'
import Activity from '../models/Activity.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/products
router.get('/', async (req, res) => {
  const { search, category } = req.query
  const q = {}
  if (category && category !== 'all') q.category = category
  if (search) {
    const rx = new RegExp(search, 'i')
    q.$or = [{ name: rx }, { sku: rx }]
  }
  const list = await Product.find(q).sort({ createdAt: -1 })
  res.json(list.map(p => p.toJSON()))
})

// POST /api/products
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const p = await Product.create(req.body)
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `mahsulot qo'shdi: ${p.name}`,
  })
  res.status(201).json(p.toJSON())
})

// PATCH /api/products/:id
router.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!p) return res.status(404).json({ error: 'Topilmadi' })
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `mahsulot ma'lumotlarini yangiladi: ${p.name}`,
  })
  res.json(p.toJSON())
})

// DELETE /api/products/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id)
  if (!p) return res.status(404).json({ error: 'Topilmadi' })
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `mahsulotni o'chirdi: ${p.name}`,
  })
  res.json({ ok: true })
})

export default router
