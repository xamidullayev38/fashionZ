/**
 * Seed MongoDB with a small, realistic dataset for FashionZ CRM.
 *
 * Two modes:
 *   1. CLI:   `npm run seed`       — wipes and reseeds
 *   2. Auto:  called from server.js — only seeds if users collection is empty
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import User from './models/User.js'
import Customer from './models/Customer.js'
import Product from './models/Product.js'
import Order from './models/Order.js'
import Activity from './models/Activity.js'

const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', "Farg'ona", 'Qarshi', 'Nukus']

const FIRST = ['Akmal', 'Bekzod', 'Dilshod', 'Madina', 'Nigora', 'Rustam', 'Sardor', 'Aziza',
               'Bobur', 'Charos', 'Feruza', 'Jasur', 'Kamol', 'Lola', 'Oybek', 'Sevara']
const LAST  = ['Karimov', 'Yusupov', 'Tursunov', 'Saidov', 'Rahimov', 'Mirzayev',
               'Nazarov', 'Olimov', 'Rashidov', 'Abdullayev', 'Karimova', 'Tursunova']

const PRODUCT_IMAGES = {
  tshirt: ['photo-1521572163474-6864f9cf17ab', 'photo-1583743814966-8936f5b7be1a', 'photo-1576566588028-4147f3842f27', 'photo-1503342217505-b0a15ec3261c'],
  shirt:  ['photo-1602810318383-e386cc2a3ccf', 'photo-1598033129183-c4f50c736f10', 'photo-1620012253295-c15cc3e65df4'],
  jeans:  ['photo-1542272604-787c3835535d', 'photo-1582552938357-32b906df40cb', 'photo-1604176354204-9268737828e4'],
  jacket: ['photo-1551028719-00167b16eac5', 'photo-1591047139829-d91aecb6caea', 'photo-1544022613-e87ca75a784a'],
  hoodie: ['photo-1556821840-3a63f95609a7', 'photo-1620799140408-edc6dcb6d633'],
  suit:   ['photo-1593030761757-71fae45fa0e7', 'photo-1507679799987-c73779587ccf'],
}
const imgUrl = (id) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&auto=format`

const CATEGORIES = [
  { id: 'tshirt', name: 'Futbolka',  priceRange: [35000, 120000] },
  { id: 'shirt',  name: "Ko'ylak",   priceRange: [80000, 280000] },
  { id: 'jeans',  name: 'Jinsi',     priceRange: [120000, 380000] },
  { id: 'jacket', name: 'Kurtka',    priceRange: [250000, 850000] },
  { id: 'hoodie', name: 'Hudi',      priceRange: [140000, 380000] },
  { id: 'suit',   name: 'Kostyum',   priceRange: [600000, 1_800_000] },
]

const BRANDS = ['FashionZ', 'UrbanWear', 'ClassicLine', 'PrimeFit', 'Royal']
const COLORS = ['Qora', 'Oq', "Ko'k", 'Qizil', 'Yashil', 'Kulrang']
const SIZES  = ['S', 'M', 'L', 'XL']

const random = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const uzName = () => `${random(FIRST)} ${random(LAST)}`
const uzPhone = () => `+998 ${random(['90','91','93','94','97','99'])} ${randomInt(100,999)} ${randomInt(10,99)} ${randomInt(10,99)}`

/**
 * Main seed function. If `wipe === true` clears collections first.
 */
export async function runSeed({ wipe = false } = {}) {
  if (wipe) {
    console.log('• Clearing existing collections...')
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Activity.deleteMany({}),
    ])
  }

  console.log('• Creating users...')
  const userSpecs = [
    { name: 'Akmal Karimov',      email: 'admin@fashionz.app',    password: 'admin123',   role: 'admin',   department: 'Rahbariyat',       position: 'Bosh administrator', salary: 18_000_000 },
    { name: 'Dilshod Yusupov',    email: 'manager@fashionz.app',  password: 'manager123', role: 'manager', department: 'Sotuv boshqaruvi', position: 'Sotuv menejeri',     salary: 12_000_000 },
    { name: 'Nigora Tursunova',   email: 'manager2@fashionz.app', password: 'manager123', role: 'manager', department: 'Ombor boshqaruvi', position: 'Ombor menejeri',     salary: 11_000_000 },
    { name: 'Madina Karimova',    email: 'sales@fashionz.app',    password: 'sales123',   role: 'sales',   department: "Sotuv bo'limi",    position: 'Sotuvchi',           salary:  6_500_000 },
    { name: 'Bobur Mirzayev',     email: 'sales2@fashionz.app',   password: 'sales123',   role: 'sales',   department: 'B2B Sotuv',        position: 'B2B vakil',          salary:  7_000_000 },
    { name: 'Sevara Abdullayeva', email: 'sales3@fashionz.app',   password: 'sales123',   role: 'sales',   department: "Sotuv bo'limi",    position: 'Sotuvchi',           salary:  6_000_000 },
    { name: 'Rustam Olimov',      email: 'sales4@fashionz.app',   password: 'sales123',   role: 'sales',   department: 'Regional sotuv',   position: 'Regional vakil',     salary:  6_800_000 },
    { name: 'Aziza Rashidova',    email: 'sales5@fashionz.app',   password: 'sales123',   role: 'sales',   department: "Sotuv bo'limi",    position: 'Kichik sotuvchi',    salary:  5_500_000 },
  ]
  const users = await Promise.all(userSpecs.map(s => User.create({ ...s, phone: uzPhone(), isActive: true })))
  const salesUsers = users.filter(u => u.role === 'sales')
  console.log(`  ✓ ${users.length} users`)

  console.log('• Creating products...')
  const products = []
  let skuCounter = 1
  for (const cat of CATEGORIES) {
    const perCat = cat.id === 'suit' ? 3 : cat.id === 'hoodie' ? 3 : 5
    for (let i = 0; i < perCat; i++) {
      const price = randomInt(cat.priceRange[0], cat.priceRange[1])
      const imageId = random(PRODUCT_IMAGES[cat.id])
      products.push(await Product.create({
        sku: `${cat.id.toUpperCase().slice(0,3)}-${String(skuCounter++).padStart(4,'0')}`,
        name: `${random(BRANDS)} ${cat.name} ${random(['Pro', 'Classic', 'Premium', ''])}`.trim(),
        category: cat.id,
        categoryName: cat.name,
        brand: random(BRANDS),
        color: random(COLORS),
        size: random(SIZES),
        price,
        cost: Math.round(price * 0.6),
        stock: randomInt(10, 200),
        minStock: 20,
        imageUrl: imgUrl(imageId),
        description: `Yuqori sifatli ${cat.name.toLowerCase()}.`,
      }))
    }
  }
  console.log(`  ✓ ${products.length} products`)

  console.log('• Creating customers...')
  const businessAdj = ['Style', 'Moda', 'Fashion', 'Trend', 'Boutique', 'Premium', 'City']
  const businessNoun = ['Shop', 'Store', 'Market', 'Plaza', 'Mall']
  const customers = []
  for (let i = 0; i < 25; i++) {
    const companyName = `${random(businessAdj)} ${random(businessNoun)} ${random(['MChJ', 'YaTT'])}`
    customers.push(await Customer.create({
      companyName,
      contactName: uzName(),
      email: `info${i}@${random(businessAdj).toLowerCase()}.uz`,
      phone: uzPhone(),
      city: random(CITIES),
      address: `${random(CITIES)} sh., ${random(['Mustaqillik', 'Amir Temur', 'Navoiy', 'Bobur'])} ${randomInt(1, 200)}`,
      type: random(['Chakana do\'kon', 'Buyum do\'koni', 'Internet-do\'kon', 'Korporativ mijoz']),
      tin: String(randomInt(200_000_000, 999_999_999)),
      assignedSalesId: random(salesUsers)._id,
      status: random(['active', 'active', 'active', 'vip', 'inactive']),
      notes: '',
    }))
  }
  console.log(`  ✓ ${customers.length} customers`)

  console.log('• Creating orders...')
  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled']
  let orderNum = 10001

  for (let i = 0; i < 60; i++) {
    const customer = random(customers)
    const itemCount = randomInt(1, 4)
    const items = []
    let subtotal = 0
    const used = new Set()
    for (let j = 0; j < itemCount; j++) {
      let p
      do { p = random(products) } while (used.has(p._id.toString()))
      used.add(p._id.toString())
      const qty = randomInt(5, 50)
      const total = p.price * qty
      items.push({ productId: p._id, productName: p.name, sku: p.sku, price: p.price, quantity: qty, total })
      subtotal += total
    }
    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.08) : 0
    const total = subtotal - discount
    const status = random(statuses)
    const createdAt = new Date(Date.now() - randomInt(0, 180) * 86_400_000)

    await Order.create({
      orderNumber: `ORD-${orderNum++}`,
      customerId: customer._id,
      customerName: customer.companyName,
      salesId: customer.assignedSalesId,
      items, subtotal, discount, total, status,
      paymentMethod: random(['Bank o\'tkazmasi', 'Naqd', 'Click', 'Payme']),
      paymentStatus: status === 'cancelled' ? 'refunded' : status === 'delivered' ? 'paid' : random(['paid', 'pending']),
      shippingAddress: customer.address,
      notes: '',
      createdAt,
      deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + randomInt(1, 7) * 86_400_000) : null,
    })

    if (status !== 'cancelled') {
      customer.totalSpent += total
      customer.orderCount += 1
      await customer.save()
    }
  }
  console.log(`  ✓ 60 orders`)

  console.log('• Creating activity log...')
  const sample = [
    'tizimga kirdi', 'yangi mijoz qo\'shdi', 'buyurtma yaratdi',
    'mahsulot ma\'lumotini yangiladi', 'buyurtma statusini o\'zgartirdi',
  ]
  for (let i = 0; i < 20; i++) {
    const u = random(users)
    await Activity.create({
      userId: u._id, userName: u.name,
      action: random(sample),
      timestamp: new Date(Date.now() - randomInt(0, 14) * 86_400_000),
    })
  }

  console.log('\n✓ Seed complete')
  console.log('\nDemo akkountlar:')
  console.log('  admin@fashionz.app    / admin123')
  console.log('  manager@fashionz.app  / manager123')
  console.log('  sales@fashionz.app    / sales123')
}

/**
 * Seed only if users collection is empty. Safe to call on every server start.
 */
export async function autoSeedIfEmpty() {
  const count = await User.countDocuments()
  if (count > 0) {
    console.log(`• Database already has ${count} users — skipping auto-seed`)
    return
  }
  console.log('• Database empty — running auto-seed...')
  await runSeed({ wipe: false })
}

// CLI entry point
const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`
if (isMain) {
  ;(async () => {
    try {
      await connectDb(process.env.MONGODB_URI)
      await runSeed({ wipe: true })
      await mongoose.disconnect()
      process.exit(0)
    } catch (err) {
      console.error('✗ Seed failed:', err)
      process.exit(1)
    }
  })()
}
