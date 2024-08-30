import dotenv from 'dotenv';
import mongoose from 'mongoose';
import config from 'config';

dotenv.config();

const db = process.env.MONGO_URL || config.get('database.mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;