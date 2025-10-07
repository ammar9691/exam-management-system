/**
 * Database Seeding Script
 * Creates dummy data for testing the exam management system
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Question.deleteMany({});
    await Exam.deleteMany({});
    await Result.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Users
    console.log('👥 Creating users...');
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        status: 'active',
        profile: {
          phone: '+1234567890',
          bio: 'System Administrator'
        },
        security: {
          isEmailVerified: true
        }
      },
      {
        name: 'Dr. John Smith',
        email: 'instructor@example.com',
        password: await bcrypt.hash('instructor123', 12),
        role: 'instructor',
        status: 'active',
        profile: {
          phone: '+1234567891',
          bio: 'Computer Science Professor'
        },
        security: {
          isEmailVerified: true
        }
      },
      {
        name: 'Alice Johnson',
        email: 'student1@example.com',
        password: await bcrypt.hash('student123', 12),
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1234567892',
          bio: 'Computer Science Student'
        },
        security: {
          isEmailVerified: true
        }
      },
      {
        name: 'Bob Wilson',
        email: 'student2@example.com',
        password: await bcrypt.hash('student123', 12),
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1234567893',
          bio: 'Mathematics Student'
        },
        security: {
          isEmailVerified: true
        }
      },
      {
        name: 'Carol Brown',
        email: 'student3@example.com',
        password: await bcrypt.hash('student123', 12),
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1234567894',
          bio: 'Physics Student'
        },
        security: {
          isEmailVerified: true
        }
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    const admin = createdUsers.find(u => u.role === 'admin');
    const instructor = createdUsers.find(u => u.role === 'instructor');
    const students = createdUsers.filter(u => u.role === 'student');

    // Create Subjects
    console.log('📚 Creating subjects...');
    const subjects = [
      {
        name: 'Computer Science',
        code: 'CS',
        description: 'Introduction to Computer Science concepts and programming',
        category: 'Technology',
        topics: [
          { name: 'Programming Fundamentals', order: 1 },
          { name: 'Data Structures', order: 2 },
          { name: 'Algorithms', order: 3 },
          { name: 'Object-Oriented Programming', order: 4 }
        ],
        instructors: [{
          user: instructor._id,
          role: 'primary',
          permissions: {
            canCreateExams: true,
            canGrade: true,
            canManageStudents: true,
            canEditSubject: true
          }
        }],
        settings: {
          isActive: true
        },
        createdBy: admin._id
      },
      {
        name: 'Mathematics',
        code: 'MATH',
        description: 'Mathematical concepts and problem solving',
        category: 'Mathematics',
        topics: [
          { name: 'Algebra', order: 1 },
          { name: 'Calculus', order: 2 },
          { name: 'Statistics', order: 3 },
          { name: 'Linear Algebra', order: 4 }
        ],
        instructors: [{
          user: instructor._id,
          role: 'primary',
          permissions: {
            canCreateExams: true,
            canGrade: true,
            canManageStudents: true,
            canEditSubject: true
          }
        }],
        settings: {
          isActive: true
        },
        createdBy: admin._id
      },
      {
        name: 'Physics',
        code: 'PHY',
        description: 'Fundamental principles of physics',
        category: 'Science',
        topics: [
          { name: 'Mechanics', order: 1 },
          { name: 'Thermodynamics', order: 2 },
          { name: 'Electromagnetism', order: 3 },
          { name: 'Quantum Physics', order: 4 }
        ],
        instructors: [{
          user: instructor._id,
          role: 'primary',
          permissions: {
            canCreateExams: true,
            canGrade: true,
            canManageStudents: true,
            canEditSubject: true
          }
        }],
        settings: {
          isActive: true
        },
        createdBy: admin._id
      }
    ];

    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`✅ Created ${createdSubjects.length} subjects`);

    // Create Questions
    console.log('❓ Creating questions...');
    const questions = [];

    // Computer Science Questions
    const csSubject = createdSubjects.find(s => s.code === 'CS');
    questions.push(
      {
        question: 'What is the time complexity of binary search?',
        type: 'multiple-choice',
        subject: 'Computer Science',
        topic: 'Algorithms',
        difficulty: 'medium',
        marks: 2,
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: true },
          { text: 'O(n log n)', isCorrect: false },
          { text: 'O(n²)', isCorrect: false }
        ],
        explanation: 'Binary search divides the search space in half at each step, resulting in O(log n) complexity.',
        tags: ['algorithms', 'complexity', 'search'],
        createdBy: instructor._id,
        status: 'active'
      },
      {
        question: 'Which data structure uses LIFO principle?',
        type: 'multiple-choice',
        subject: 'Computer Science',
        topic: 'Data Structures',
        difficulty: 'easy',
        marks: 1,
        options: [
          { text: 'Queue', isCorrect: false },
          { text: 'Stack', isCorrect: true },
          { text: 'Array', isCorrect: false },
          { text: 'Linked List', isCorrect: false }
        ],
        explanation: 'Stack follows Last In First Out (LIFO) principle.',
        tags: ['data-structures', 'stack'],
        createdBy: instructor._id,
        status: 'active'
      },
      {
        question: 'What is polymorphism in OOP?',
        type: 'fill-in-blank',
        subject: 'Computer Science',
        topic: 'Object-Oriented Programming',
        difficulty: 'medium',
        marks: 3,
        correctAnswer: 'The ability of objects to take multiple forms',
        explanation: 'Polymorphism allows objects of different classes to be treated as objects of a common base class.',
        tags: ['oop', 'polymorphism'],
        createdBy: instructor._id,
        status: 'active'
      }
    );

    // Mathematics Questions
    const mathSubject = createdSubjects.find(s => s.code === 'MATH');
    questions.push(
      {
        question: 'What is the derivative of x²?',
        type: 'multiple-choice',
        subject: 'Mathematics',
        topic: 'Calculus',
        difficulty: 'easy',
        marks: 1,
        options: [
          { text: '2x', isCorrect: true },
          { text: 'x', isCorrect: false },
          { text: '2x²', isCorrect: false },
          { text: 'x²', isCorrect: false }
        ],
        explanation: 'The derivative of x² is 2x using the power rule.',
        tags: ['calculus', 'derivatives'],
        createdBy: instructor._id,
        status: 'active'
      },
      {
        question: 'Solve: 2x + 5 = 15',
        type: 'fill-in-blank',
        subject: 'Mathematics',
        topic: 'Algebra',
        difficulty: 'easy',
        marks: 2,
        correctAnswer: '5',
        explanation: '2x = 15 - 5 = 10, so x = 5',
        tags: ['algebra', 'equations'],
        createdBy: instructor._id,
        status: 'active'
      }
    );

    // Physics Questions
    const physicsSubject = createdSubjects.find(s => s.code === 'PHY');
    questions.push(
      {
        question: 'What is Newton\'s first law of motion?',
        type: 'multiple-choice',
        subject: 'Physics',
        topic: 'Mechanics',
        difficulty: 'easy',
        marks: 1,
        options: [
          { text: 'F = ma', isCorrect: false },
          { text: 'An object at rest stays at rest unless acted upon by a force', isCorrect: true },
          { text: 'For every action, there is an equal and opposite reaction', isCorrect: false },
          { text: 'Energy cannot be created or destroyed', isCorrect: false }
        ],
        explanation: 'Newton\'s first law states that an object will remain at rest or in uniform motion unless acted upon by an external force.',
        tags: ['mechanics', 'newton-laws'],
        createdBy: instructor._id,
        status: 'active'
      }
    );

    const createdQuestions = await Question.insertMany(questions);
    console.log(`✅ Created ${createdQuestions.length} questions`);

    // Create Exams
    console.log('📝 Creating exams...');
    const exams = [
      {
        title: 'Computer Science Midterm',
        description: 'Midterm examination covering programming fundamentals and data structures',
        subject: 'Computer Science',
        type: 'final',
        duration: 90,
        totalMarks: 50,
        passingMarks: 25,
        questions: createdQuestions
          .filter(q => q.subject === 'Computer Science')
          .slice(0, 3)
          .map((q, index) => ({
            question: q._id,
            marks: q.marks,
            negativeMarks: 0,
            order: index + 1
          })),
        instructions: 'Read all questions carefully. Manage your time wisely.',
        settings: {
          randomizeQuestions: false,
          showResults: true,
          allowReview: true,
          autoSubmit: true
        },
        schedule: {
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          timezone: 'UTC'
        },
        eligibility: {
          students: students.map(s => s._id),
          maxAttempts: 2
        },
        status: 'active',
        createdBy: instructor._id
      },
      {
        title: 'Mathematics Quiz 1',
        description: 'Quick quiz on algebra and calculus basics',
        subject: 'Mathematics',
        type: 'quiz',
        duration: 30,
        totalMarks: 20,
        passingMarks: 12,
        questions: createdQuestions
          .filter(q => q.subject === 'Mathematics')
          .map((q, index) => ({
            question: q._id,
            marks: q.marks,
            negativeMarks: 0,
            order: index + 1
          })),
        instructions: 'This is a quick quiz. Answer all questions.',
        settings: {
          randomizeQuestions: true,
          showResults: true,
          allowReview: false,
          autoSubmit: true
        },
        schedule: {
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          timezone: 'UTC'
        },
        eligibility: {
          students: students.map(s => s._id),
          maxAttempts: 1
        },
        status: 'active',
        createdBy: instructor._id
      }
    ];

    const createdExams = await Exam.insertMany(exams);
    console.log(`✅ Created ${createdExams.length} exams`);

    // Create Sample Results
    console.log('📊 Creating sample results...');
    const results = [];

    for (const exam of createdExams) {
      // Create results for first 2 students
      for (let i = 0; i < Math.min(2, students.length); i++) {
        const student = students[i];
        const score = Math.floor(Math.random() * exam.totalMarks) + (exam.totalMarks * 0.3); // At least 30%
        
        const correctAnswers = Math.floor(exam.questions.length * 0.7);
        const incorrectAnswers = exam.questions.length - correctAnswers;
        const marksObtained = Math.floor(score);
        const percentage = Math.floor((score / exam.totalMarks) * 100);
        
        results.push({
          student: student._id,
          exam: exam._id,
          attemptNumber: 1,
          answers: exam.questions.map(q => ({
            question: q.question,
            textAnswer: 'Sample answer',
            isCorrect: Math.random() > 0.3, // 70% correct rate
            marksObtained: Math.random() > 0.3 ? q.marks : 0,
            timeSpent: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
          })),
          session: {
            startTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
            endTime: new Date(Date.now() - Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000)),
            activities: [{
              type: 'start',
              timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
            }, {
              type: 'submit',
              timestamp: new Date(Date.now() - Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000))
            }]
          },
          scoring: {
            totalMarks: exam.totalMarks,
            marksObtained: marksObtained,
            percentage: percentage,
            grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'F',
            passed: marksObtained >= exam.passingMarks
          },
          stats: {
            totalQuestions: exam.questions.length,
            attemptedQuestions: exam.questions.length,
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
            skippedQuestions: 0,
            totalTimeSpent: Math.floor(Math.random() * exam.duration) // Random time within exam duration
          },
          analytics: {
            subjectWise: [{
              subject: exam.subject,
              totalQuestions: exam.questions.length,
              correctAnswers: correctAnswers,
              marksObtained: marksObtained,
              totalMarks: exam.totalMarks,
              percentage: percentage
            }]
          },
          status: 'completed'
        });
      }
    }

    const createdResults = [];
    for (const result of results) {
      try {
        const createdResult = await Result.create(result);
        createdResults.push(createdResult);
      } catch (error) {
        console.log('Skipping result due to error:', error.message);
      }
    }
    console.log(`✅ Created ${createdResults.length} results`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   📚 Subjects: ${createdSubjects.length}`);
    console.log(`   ❓ Questions: ${createdQuestions.length}`);
    console.log(`   📝 Exams: ${createdExams.length}`);
    console.log(`   📊 Results: ${createdResults.length}`);

    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Instructor: instructor@example.com / instructor123');
    console.log('   Student: student1@example.com / student123');
    console.log('   Student: student2@example.com / student123');
    console.log('   Student: student3@example.com / student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeding script
seedData();