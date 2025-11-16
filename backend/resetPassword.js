import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('Finding instructor...');
    const instructor = await User.findOne({ role: 'instructor' }).select('+password');
    
    if (!instructor) {
      console.error('No instructor found');
      return;
    }
    
    console.log('Instructor found:', instructor.name, instructor.email);
    console.log('Current password hash:', instructor.password ? 'exists' : 'missing');
    
    // Set password - this will be hashed automatically by the pre-save middleware
    instructor.password = 'password123';
    instructor.markModified('password'); // Ensure mongoose knows the password has changed
    
    await instructor.save();
    
    console.log('✅ Password reset successfully');
    
    // Test the new password
    console.log('Testing new password...');
    const testUser = await User.findOne({ email: instructor.email }).select('+password');
    const isMatch = await testUser.comparePassword('password123');
    console.log('Password test result:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

resetPassword();