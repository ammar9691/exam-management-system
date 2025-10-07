/**
 * Script to add admin2 user for testing
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';

const addAdmin2 = async () => {
  try {
    console.log('🔧 Adding admin2 user...');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Check if admin2 already exists
    const existingAdmin = await User.findOne({ email: 'admin2@example.com' });
    if (existingAdmin) {
      console.log('⚠️ admin2@example.com already exists!');
      console.log('Current admin2 user:', {
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status
      });
    } else {
      // Create admin2 user
      const admin2 = new User({
        name: 'Admin User 2',
        email: 'admin2@example.com',
        password: await bcrypt.hash('Admin123!', 12),
        role: 'admin',
        status: 'active',
        profile: {
          phone: '+1234567895',
          bio: 'System Administrator 2'
        },
        security: {
          isEmailVerified: true
        }
      });

      await admin2.save();
      console.log('✅ admin2@example.com created successfully!');
      console.log('📧 Email: admin2@example.com');
      console.log('🔐 Password: Admin123!');
      console.log('👤 Role: admin');
    }

    // List all admin users
    const admins = await User.find({ role: 'admin' }).select('name email role status');
    console.log('\n👥 All admin users:');
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - ${admin.status}`);
    });

  } catch (error) {
    console.error('❌ Error adding admin2:', error);
  } finally {
    process.exit(0);
  }
};

// Run the script
addAdmin2();