import mongoose from 'mongoose';
import config from '../config.js';

// MongoDB connection options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false
};

// Connect to MongoDB
export const connectDatabase = async () => {
  try {
    // Disable deprecation warnings
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    const conn = await mongoose.connect(config.db.uri, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    // Log connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection close:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Close database connection
export const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};

// Clear database (for testing)
export const clearDatabase = async () => {
  if (config.server.env !== 'test') {
    throw new Error('Database clear is only allowed in test environment');
  }
  
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error.message);
    throw error;
  }
};