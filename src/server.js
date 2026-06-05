import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDb } from './db.js'
import { autoSeedIfEmpty } from './seed.js'

import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import customersRoutes from './routes/customers.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import activitiesRoutes from './routes/activities.js'
import statsRoutes from './routes/stats.js'

const {
  PORT = 3001,
  MONGODB_URI,
  CLIENT_ORIGIN = 'http://localhost:5173',
} = process.env

if (!MONGODB_URI) {
  console.error('✗ MONGODB_URI is not set. Copy .env.example to .env and fill in.')
  process.exit(1)
}

const app = express()

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// Mount routes
app.use('/api/auth',       authRoutes)
app.use('/api/users',      usersRoutes)
app.use('/api/customers',  customersRoutes)
app.use('/api/products',   productsRoutes)
app.use('/api/orders',     ordersRoutes)
app.use('/api/activities', activitiesRoutes)
app.use('/api/stats',      statsRoutes)

// 404
app.use('/api', (_, res) => res.status(404).json({ error: 'Not found' }))

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Server error' })
})

async function start() {
  await connectDb(MONGODB_URI)
  await autoSeedIfEmpty()
  app.listen(PORT, () => {
    console.log(`✓ Backend running on http://localhost:${PORT}`)
    console.log(`  CORS allowed origin: ${CLIENT_ORIGIN}`)
  })
}

start().catch(err => {
  console.error('✗ Failed to start:', err.message)
  process.exit(1)
})
