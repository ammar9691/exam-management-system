/**
 * Seed test data for grading and student management
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Exam from './models/Exam.js';
import Result from './models/Result.js';

dotenv.config();

const seedTestData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get instructor ID
    const instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      console.error('No instructor found in database');
      return;
    }

    // Get students
    const students = await User.find({ role: 'student' });
    if (students.length === 0) {
      console.error('No students found in database');
      return;
    }

    // Get instructor's exam
    const instructorExam = await Exam.findOne({ createdBy: instructor._id });
    if (!instructorExam) {
      console.error('No exams found for instructor');
      return;
    }

    console.log(`Found instructor: ${instructor.name}`);
    console.log(`Found ${students.length} students`);
    console.log(`Found exam: ${instructorExam.title}`);

    // Create sample results for different scenarios
    const sampleResults = [
      {
        student: students[0]._id, // Alice Johnson
        exam: instructorExam._id,
        status: 'submitted',
        submittedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 0, // Needs grading
          percentage: 0,
          grade: 'F'
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 3,
          correctAnswers: 0, // Will be calculated
          incorrectAnswers: 0,
          totalTimeSpent: 30 // 30 minutes
        },
        session: {
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { type: 'submit', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) }
          ]
        },
        certificates: []
      },
      {
        student: students[1]._id, // Bob Wilson
        exam: instructorExam._id,
        status: 'completed',
        submittedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
        reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        reviewedBy: instructor._id,
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 42,
          percentage: 84,
          grade: 'A',
          passed: true
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 3,
          correctAnswers: 3,
          incorrectAnswers: 0,
          totalTimeSpent: 25 // 25 minutes
        },
        feedback: {
          overall: 'Excellent work! Well done.',
          strengths: ['Good understanding of concepts'],
          improvements: ['Keep up the good work']
        },
        session: {
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
            { type: 'submit', timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000) }
          ]
        },
        certificates: []
      },
      {
        student: students[2]._id, // Carol Brown
        exam: instructorExam._id,
        status: 'submitted',
        submittedAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 0, // Needs grading
          percentage: 0,
          grade: 'F'
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 3,
          correctAnswers: 0, // Will be calculated
          incorrectAnswers: 0,
          totalTimeSpent: 30 // 30 minutes
        },
        session: {
          startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          endTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
            { type: 'submit', timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000) }
          ]
        },
        certificates: []
      }
    ];

    // If we have more students, add more sample results
    if (students.length > 3) {
      sampleResults.push({
        student: students[3]._id, // 4th student
        exam: instructorExam._id,
        status: 'in-progress',
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 0,
          percentage: 0,
          grade: 'F'
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 1,
          correctAnswers: 0,
          incorrectAnswers: 0,
          totalTimeSpent: 15 // 15 minutes so far
        },
        session: {
          startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 15 * 60 * 1000) }
          ]
        },
        certificates: []
      });
    }

    // Clear existing results for this exam to avoid duplicates
    console.log('Clearing existing test results...');
    await Result.deleteMany({ exam: instructorExam._id });

    // Insert sample results one by one
    console.log('Creating sample results...');
    const createdResults = [];
    
    for (let i = 0; i < sampleResults.length; i++) {
      try {
        // Create result with validation disabled for pre-save hooks
        const result = await Result.create(sampleResults[i], { validateBeforeSave: false });
        createdResults.push(result);
        
        const student = students.find(s => s._id.toString() === result.student.toString());
        console.log(`  ✓ ${student.name}: ${result.status} (Score: ${result.scoring.marksObtained || 'Not graded'})`);
      } catch (error) {
        console.error(`  ✗ Error creating result ${i + 1}:`, error.message);
      }
    }
    
    console.log(`Created ${createdResults.length} sample results out of ${sampleResults.length}:`);

    console.log('\n✅ Test data seeded successfully!');
    console.log('\nGrading Queue should now show:');
    console.log('  - 2 submissions awaiting grading');
    console.log('  - 1 graded result');
    console.log('  - 1 in-progress exam (if 4+ students exist)');

  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

seedTestData();