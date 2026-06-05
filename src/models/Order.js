import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku:         { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  total:       { type: Number, required: true },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber:     { type: String, required: true, unique: true, index: true },
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName:    { type: String, required: true },
  salesId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  items:           { type: [orderItemSchema], required: true },
  subtotal:        { type: Number, required: true },
  discount:        { type: Number, default: 0 },
  total:           { type: Number, required: true },
  status:          { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true },
  paymentMethod:   { type: String, default: 'Bank o\'tkazmasi' },
  paymentStatus:   { type: String, enum: ['paid', 'pending', 'partial', 'refunded'], default: 'pending' },
  shippingAddress: { type: String, default: '' },
  notes:           { type: String, default: '' },
  deliveredAt:     { type: Date, default: null },
}, { timestamps: true })

orderSchema.methods.toJSON = function () {
  const obj = this.toObject()
  obj.id = obj._id.toString()
  obj.customerId = obj.customerId?.toString()
  if (obj.salesId) obj.salesId = obj.salesId.toString()
  obj.items = obj.items.map(i => ({ ...i, productId: i.productId?.toString() }))
  obj.createdAt = obj.createdAt?.toISOString()
  delete obj.__v
  return obj
}

export default mongoose.model('Order', orderSchema)
