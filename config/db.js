import dotenv from 'dotenv';
import mongoose from 'mongoose';
import config from 'config';

dotenv.config();

// config.get('mongoURI') will correctly fetch from environment variable MONGO_URI
// due to custom-environment-variables.json, or from default.json if defined there.
const db = config.get('mongoURI');

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