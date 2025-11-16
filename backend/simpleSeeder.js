/**
 * Simple seed test data for grading and student management
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Exam from './models/Exam.js';

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

    // Clear existing results for this exam to avoid duplicates
    console.log('Clearing existing test results...');
    await mongoose.connection.db.collection('results').deleteMany({ exam: instructorExam._id });

    // Create sample results directly in MongoDB collection (bypassing mongoose middleware)
    const sampleResults = [
      {
        student: students[0]._id,
        exam: instructorExam._id,
        attemptNumber: 1,
        status: 'submitted',
        submittedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 0,
          percentage: 0,
          grade: 'F',
          passed: false
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 3,
          correctAnswers: 2,
          incorrectAnswers: 1,
          skippedQuestions: 0,
          flaggedQuestions: 0,
          averageTimePerQuestion: 600,
          totalTimeSpent: 30
        },
        session: {
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { type: 'submit', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) }
          ]
        },
        answers: [],
        certificates: [],
        feedback: { strengths: [], improvements: [], recommendations: [] },
        analytics: { subjectWise: [], topicWise: [], difficultyWise: { easy: { total: 0, correct: 0, percentage: 0 }, medium: { total: 0, correct: 0, percentage: 0 }, hard: { total: 0, correct: 0, percentage: 0 } } },
        metadata: { examVersion: 1, violationCount: 0, isProctored: false },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        student: students[1]._id,
        exam: instructorExam._id,
        attemptNumber: 1,
        status: 'completed',
        submittedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
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
          skippedQuestions: 0,
          flaggedQuestions: 0,
          averageTimePerQuestion: 500,
          totalTimeSpent: 25
        },
        session: {
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
            { type: 'submit', timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000) }
          ]
        },
        answers: [],
        certificates: [],
        feedback: { 
          overall: 'Excellent work! Well done.',
          strengths: ['Good understanding of concepts'],
          improvements: ['Keep up the good work'],
          recommendations: []
        },
        analytics: { subjectWise: [], topicWise: [], difficultyWise: { easy: { total: 0, correct: 0, percentage: 0 }, medium: { total: 0, correct: 0, percentage: 0 }, hard: { total: 0, correct: 0, percentage: 0 } } },
        metadata: { examVersion: 1, violationCount: 0, isProctored: false },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        student: students[2]._id,
        exam: instructorExam._id,
        attemptNumber: 1,
        status: 'submitted',
        submittedAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 0,
          percentage: 0,
          grade: 'F',
          passed: false
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 3,
          correctAnswers: 1,
          incorrectAnswers: 2,
          skippedQuestions: 0,
          flaggedQuestions: 0,
          averageTimePerQuestion: 600,
          totalTimeSpent: 30
        },
        session: {
          startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
            { type: 'submit', timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000) }
          ]
        },
        answers: [],
        certificates: [],
        feedback: { strengths: [], improvements: [], recommendations: [] },
        analytics: { subjectWise: [], topicWise: [], difficultyWise: { easy: { total: 0, correct: 0, percentage: 0 }, medium: { total: 0, correct: 0, percentage: 0 }, hard: { total: 0, correct: 0, percentage: 0 } } },
        metadata: { examVersion: 1, violationCount: 0, isProctored: false },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    if (students.length > 3) {
      sampleResults.push({
        student: students[3]._id,
        exam: instructorExam._id,
        attemptNumber: 1,
        status: 'in-progress',
        scoring: {
          totalMarks: instructorExam.totalMarks,
          marksObtained: 0,
          percentage: 0,
          grade: 'F',
          passed: false
        },
        stats: {
          totalQuestions: 3,
          attemptedQuestions: 1,
          correctAnswers: 1,
          incorrectAnswers: 0,
          skippedQuestions: 2,
          flaggedQuestions: 0,
          averageTimePerQuestion: 900,
          totalTimeSpent: 15
        },
        session: {
          startTime: new Date(Date.now() - 15 * 60 * 1000),
          activities: [
            { type: 'start', timestamp: new Date(Date.now() - 15 * 60 * 1000) }
          ]
        },
        answers: [],
        certificates: [],
        feedback: { strengths: [], improvements: [], recommendations: [] },
        analytics: { subjectWise: [], topicWise: [], difficultyWise: { easy: { total: 0, correct: 0, percentage: 0 }, medium: { total: 0, correct: 0, percentage: 0 }, hard: { total: 0, correct: 0, percentage: 0 } } },
        metadata: { examVersion: 1, violationCount: 0, isProctored: false },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Creating sample results...');
    const result = await mongoose.connection.db.collection('results').insertMany(sampleResults);
    console.log(`Created ${result.insertedCount} sample results:`);

    for (let i = 0; i < sampleResults.length; i++) {
      const student = students.find(s => s._id.toString() === sampleResults[i].student.toString());
      console.log(`  ✓ ${student.name}: ${sampleResults[i].status} (Score: ${sampleResults[i].scoring.marksObtained || 'Not graded'})`);
    }

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