import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const verifyData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== Results ===');
    const results = await mongoose.connection.db.collection('results').find({}).toArray();
    
    results.forEach(result => {
      console.log(`Student: ${result.student}`);
      console.log(`Exam: ${result.exam}`);
      console.log(`Status: ${result.status}`);
      console.log(`Score: ${result.scoring.marksObtained}/${result.scoring.totalMarks}`);
      console.log('---');
    });
    
    console.log(`\nTotal results: ${results.length}`);
    console.log(`- Submitted (needs grading): ${results.filter(r => r.status === 'submitted').length}`);
    console.log(`- Completed (graded): ${results.filter(r => r.status === 'completed').length}`);
    console.log(`- In progress: ${results.filter(r => r.status === 'in-progress').length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

verifyData();