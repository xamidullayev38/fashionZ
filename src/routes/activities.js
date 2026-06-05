import { Router } from 'express'
import Activity from '../models/Activity.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
  const list = await Activity.find().sort({ timestamp: -1 }).limit(200)
  res.json(list.map(a => a.toJSON()))
})

export default router
