import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check indexes on results collection
    const indexes = await mongoose.connection.db.collection('results').indexes();
    console.log('Current indexes on results collection:');
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    // Drop the problematic certificate index
    try {
      await mongoose.connection.db.collection('results').dropIndex('certificates.certificateId_1');
      console.log('\nDropped certificates.certificateId_1 index');
    } catch (err) {
      console.log('Error dropping index (may not exist):', err.message);
    }
    
    // Also check for any remaining problematic data
    const resultsWithNullCerts = await mongoose.connection.db.collection('results').find({
      'certificates.certificateId': null
    }).count();
    console.log(`Found ${resultsWithNullCerts} results with null certificateId`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

fixIndexes();