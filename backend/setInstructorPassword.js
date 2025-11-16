import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const setInstructorPassword = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('Finding instructor...');
    const instructor = await User.findOne({ role: 'instructor' });
    
    if (!instructor) {
      console.error('No instructor found');
      return;
    }
    
    console.log('Instructor found:', instructor.name, instructor.email);
    
    // Set password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    instructor.password = hashedPassword;
    await instructor.save();
    
    console.log('✅ Password set successfully for instructor');
    console.log('Email:', instructor.email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

setInstructorPassword();