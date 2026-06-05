import { Router } from 'express'
import User from '../models/User.js'
import Activity from '../models/Activity.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

// GET /api/users
router.get('/', requireRole('admin', 'manager'), async (req, res) => {
  const { role, search } = req.query
  const q = {}
  if (role) q.role = role
  if (search) {
    const rx = new RegExp(search, 'i')
    q.$or = [{ name: rx }, { email: rx }, { phone: rx }]
  }
  const list = await User.find(q).sort({ createdAt: -1 })
  res.json(list.map(u => u.toJSON()))
})

// POST /api/users
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const { name, email, password, role, phone, department, position, salary, isActive } = req.body
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role majburiy' })
  }
  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) return res.status(409).json({ error: 'Email allaqachon mavjud' })

  const user = await User.create({ name, email, password, role, phone, department, position, salary, isActive })
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `yangi ${role} qo'shdi: ${name}`,
  })
  res.status(201).json(user.toJSON())
})

// PATCH /api/users/:id
router.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  const target = await User.findById(req.params.id)
  if (!target) return res.status(404).json({ error: 'Topilmadi' })

  // Manager cannot edit admin accounts
  if (target.role === 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin akkountini o'zgartira olmaysiz" })
  }

  const allowed = ['name', 'email', 'phone', 'role', 'department', 'position', 'salary', 'isActive']
  for (const k of allowed) {
    if (k in req.body) target[k] = req.body[k]
  }
  if (req.body.password) target.password = req.body.password
  await target.save()

  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `xodim ma'lumotlarini yangiladi: ${target.name}`,
  })
  res.json(target.toJSON())
})

// DELETE /api/users/:id
router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" })
  }
  const target = await User.findById(req.params.id)
  if (!target) return res.status(404).json({ error: 'Topilmadi' })
  if (target.role === 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin akkountini o'chira olmaysiz" })
  }
  await target.deleteOne()
  await Activity.create({
    userId: req.user._id, userName: req.user.name,
    action: `xodimni o'chirdi: ${target.name}`,
  })
  res.json({ ok: true })
})

export default router
