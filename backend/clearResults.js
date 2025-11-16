import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Result from './models/Result.js';

dotenv.config();

const clearResults = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('Clearing ALL results...');
    const deleteResult = await Result.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} results`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

clearResults();