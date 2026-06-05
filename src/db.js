import mongoose from 'mongoose'

export async function connectDb(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
  console.log(`✓ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`)
  return mongoose.connection
}
