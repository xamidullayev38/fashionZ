import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName:  { type: String, required: true },
  action:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
}, { versionKey: false })

activitySchema.methods.toJSON = function () {
  const obj = this.toObject()
  obj.id = obj._id.toString()
  obj.userId = obj.userId?.toString()
  obj.timestamp = obj.timestamp?.toISOString()
  return obj
}

export default mongoose.model('Activity', activitySchema)
