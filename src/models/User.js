import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone:      { type: String, default: '' },
  role:       { type: String, enum: ['admin', 'manager', 'sales'], required: true, index: true },
  password:   { type: String, required: true, select: false },
  department: { type: String, default: '' },
  position:   { type: String, default: '' },
  salary:     { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.__v
  obj.id = obj._id.toString()
  return obj
}

export default mongoose.model('User', userSchema)
