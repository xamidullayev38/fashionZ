import { Router } from 'express'
import Customer from '../models/Customer.js'
import Activity from '../models/Activity.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/customers
router.get('/', async (req, res) => {
  const { search, city } = req.query
  const q = {}
  if (req.user.role === 'sales') q.assignedSalesId = req.user._id
  if (city && city !== 'all') q.city = city
  if (search) {
    const rx = new RegExp(search, 'i')
    q.$or = [{ companyName: rx }, { contactName: rx }, { phone: rx }]
  }
  const list = await Customer.find(q).sort({ createdAt: -1 })
  res.json(list.map(c => c.toJSON()))
})

// POST /api/customers
router.post('/', async (req, res) => {
  const data = { ...req.body }
  if (req.user.role === 'sales') data.assignedSalesId = req.user._id
  const c = await Customer.create(data)
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `yangi mijoz qo'shdi: ${c.companyName}`,
  })
  res.status(201).json(c.toJSON())
})

// PATCH /api/customers/:id
router.patch('/:id', async (req, res) => {
  const c = await Customer.findById(req.params.id)
  if (!c) return res.status(404).json({ error: 'Topilmadi' })

  if (req.user.role === 'sales' && c.assignedSalesId?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Bu mijozni tahrirlay olmaysiz' })
  }
  Object.assign(c, req.body)
  await c.save()
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `mijoz ma'lumotlarini yangiladi: ${c.companyName}`,
  })
  res.json(c.toJSON())
})

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  if (req.user.role === 'sales') {
    return res.status(403).json({ error: "Mijozni o'chirish uchun ruxsat yo'q" })
  }
  const c = await Customer.findByIdAndDelete(req.params.id)
  if (!c) return res.status(404).json({ error: 'Topilmadi' })
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `mijozni o'chirdi: ${c.companyName}`,
  })
  res.json({ ok: true })
})

export default router
