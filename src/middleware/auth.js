import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authorization token kerak' })
    }

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' })
    }

    // Guard against stale tokens whose `sub` isn't a valid ObjectId
    if (!payload?.sub || !mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ error: 'Yaroqsiz token (id format)' })
    }

    const user = await User.findById(payload.sub)
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi yoki bloklangan' })
    }
    req.user = user
    next()
  } catch (err) {
    console.error('requireAuth error:', err)
    return res.status(401).json({ error: 'Avtorizatsiya xatosi' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Autentifikatsiya kerak' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Ruxsat etilmagan (kerak: ${roles.join(' yoki ')})` })
    }
    next()
  }
}
