import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  companyName:      { type: String, required: true, trim: true, index: true },
  contactName:      { type: String, required: true, trim: true },
  email:            { type: String, default: '', lowercase: true, trim: true },
  phone:            { type: String, required: true },
  city:             { type: String, required: true, index: true },
  address:          { type: String, default: '' },
  type:             { type: String, default: 'Chakana do\'kon' },
  tin:              { type: String, default: '' },
  assignedSalesId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status:           { type: String, enum: ['active', 'inactive', 'vip'], default: 'active', index: true },
  notes:            { type: String, default: '' },
  totalSpent:       { type: Number, default: 0 },
  orderCount:       { type: Number, default: 0 },
}, { timestamps: true })

customerSchema.methods.toJSON = function () {
  const obj = this.toObject()
  obj.id = obj._id.toString()
  if (obj.assignedSalesId) obj.assignedSalesId = obj.assignedSalesId.toString()
  delete obj.__v
  return obj
}

export default mongoose.model('Customer', customerSchema)
