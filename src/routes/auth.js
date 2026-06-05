import { Router } from 'express'
import User from '../models/User.js'
import Activity from '../models/Activity.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

// Fire-and-forget activity log — never fails the request
const logSilent = (data) => Activity.create(data).catch(err =>
  console.warn('Activity log failed:', err.message)
)

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, requiredRole } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kerak' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user) return res.status(401).json({ error: "Email yoki parol noto'g'ri" })

    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ error: "Email yoki parol noto'g'ri" })

    if (!user.isActive) return res.status(403).json({ error: 'Hisobingiz bloklangan' })

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({
        error: `Bu portal faqat ${requiredRole === 'admin' ? 'administratorlar' : 'menejerlar'} uchun`,
      })
    }

    const token = signToken(user)

    logSilent({ userId: user._id, userName: user.name, action: 'tizimga kirdi' })

    res.json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('login error:', err)
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toJSON() })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  logSilent({ userId: req.user._id, userName: req.user.name, action: 'tizimdan chiqdi' })
  res.json({ ok: true })
})

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {}
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Yangi parol kamida 6 belgi bo'lishi kerak" })
    }
    const user = await User.findById(req.user._id).select('+password')
    const ok = await user.comparePassword(oldPassword)
    if (!ok) return res.status(401).json({ error: "Joriy parol noto'g'ri" })
    user.password = newPassword
    await user.save()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
