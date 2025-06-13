import mongoose from 'mongoose';

export const connectMongoDB = async () => {
  try {
    await mongoose.connect('mongodb://mongodb:27017/quartissimo');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};