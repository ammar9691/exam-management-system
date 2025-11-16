/**
 * Test script for grading API endpoints
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

// Login credentials for instructor
const INSTRUCTOR_EMAIL = 'instructor@example.com';
const INSTRUCTOR_PASSWORD = 'password123';

let authToken = '';

const login = async () => {
  console.log('🔐 Logging in as instructor...');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD
    })
  });
  
  const data = await response.json();
  
  if (response.ok && data.token) {
    authToken = data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.error('❌ Login failed:', data.message);
    return false;
  }
};

const testGradingQueue = async () => {
  console.log('\n📋 Testing grading queue...');
  
  try {
    const response = await fetch(`${BASE_URL}/instructor/grading/queue`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Grading queue retrieved successfully');
      console.log(`   Found ${data.data.results.length} results in queue`);
      console.log(`   Total pending: ${data.data.pagination.total}`);
      
      // Show some details
      data.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. Student: ${result.student?.name || 'N/A'}`);
        console.log(`      Exam: ${result.exam?.title || 'N/A'}`);
        console.log(`      Status: ${result.status}`);
        console.log(`      Submitted: ${new Date(result.submittedAt).toLocaleString()}`);
      });
    } else {
      console.error('❌ Failed to get grading queue:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing grading queue:', error.message);
  }
};

const testGradingStats = async () => {
  console.log('\n📊 Testing grading statistics...');
  
  try {
    const response = await fetch(`${BASE_URL}/instructor/grading/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Grading stats retrieved successfully');
      console.log(`   Pending grading: ${data.data.stats.pendingGrading}`);
      console.log(`   Total graded: ${data.data.stats.totalGraded}`);
      console.log(`   In progress: ${data.data.stats.inProgressResults}`);
      console.log(`   Recent activity: ${data.data.stats.recentlyGraded.length} items`);
    } else {
      console.error('❌ Failed to get grading stats:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing grading stats:', error.message);
  }
};

const testStudentsList = async () => {
  console.log('\n👥 Testing students list...');
  
  try {
    const response = await fetch(`${BASE_URL}/instructor/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Students list retrieved successfully');
      console.log(`   Found ${data.data.students.length} students`);
      console.log(`   Total: ${data.data.pagination.total}`);
      
      // Show some details
      data.data.students.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.email})`);
        console.log(`      Total exams: ${student.stats.totalExams}`);
        console.log(`      Completed: ${student.stats.completedExams}`);
        console.log(`      Average score: ${student.stats.averageScore}`);
      });
    } else {
      console.error('❌ Failed to get students list:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing students list:', error.message);
  }
};

const testStudentStats = async () => {
  console.log('\n📈 Testing student statistics...');
  
  try {
    const response = await fetch(`${BASE_URL}/instructor/students/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Student stats retrieved successfully');
      console.log(`   Total students: ${data.data.stats.totalStudents}`);
      console.log(`   Active students: ${data.data.stats.activeStudents}`);
      console.log(`   Students with completed exams: ${data.data.stats.studentsWithCompleted}`);
      console.log('   Performance distribution:');
      console.log(`     Excellent (90-100%): ${data.data.stats.performanceDistribution.excellent}`);
      console.log(`     Good (70-89%): ${data.data.stats.performanceDistribution.good}`);
      console.log(`     Average (50-69%): ${data.data.stats.performanceDistribution.average}`);
      console.log(`     Poor (<50%): ${data.data.stats.performanceDistribution.poor}`);
    } else {
      console.error('❌ Failed to get student stats:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing student stats:', error.message);
  }
};

const testDashboard = async () => {
  console.log('\n🏠 Testing dashboard overview...');
  
  try {
    const response = await fetch(`${BASE_URL}/instructor/grading/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Dashboard overview retrieved successfully');
      const overview = data.data.overview;
      console.log(`   Total exams: ${overview.totalExams}`);
      console.log(`   Pending grading: ${overview.pendingGrading}`);
      console.log(`   Total graded: ${overview.totalGraded}`);
      console.log(`   Active exams: ${overview.activeExams}`);
      console.log(`   Recent grading: ${overview.recentGrading.length} items`);
      console.log(`   Upcoming exams: ${overview.upcomingExams.length} items`);
    } else {
      console.error('❌ Failed to get dashboard:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing dashboard:', error.message);
  }
};

const runTests = async () => {
  console.log('🚀 Starting API tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }
  
  // Run all tests
  await testGradingQueue();
  await testGradingStats();
  await testStudentsList();
  await testStudentStats();
  await testDashboard();
  
  console.log('\n🎉 API tests completed!');
};

// Run the tests
runTests().catch(console.error);