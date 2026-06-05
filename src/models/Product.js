import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  sku:           { type: String, required: true, unique: true, trim: true, index: true },
  name:          { type: String, required: true, trim: true },
  category:      { type: String, required: true, index: true },
  categoryName:  { type: String, required: true },
  brand:         { type: String, default: 'FashionZ' },
  color:         { type: String, default: '' },
  size:          { type: String, default: 'M' },
  price:         { type: Number, required: true, min: 0 },
  cost:          { type: Number, default: 0, min: 0 },
  stock:         { type: Number, default: 0, min: 0 },
  minStock:      { type: Number, default: 20 },
  imageUrl:      { type: String, default: '' },
  description:   { type: String, default: '' },
}, { timestamps: true })

productSchema.methods.toJSON = function () {
  const obj = this.toObject()
  obj.id = obj._id.toString()
  delete obj.__v
  return obj
}

export default mongoose.model('Product', productSchema)
