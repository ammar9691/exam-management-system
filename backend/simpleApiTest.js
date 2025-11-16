// Simple API test
const testAPI = async () => {
  try {
    // Login
    console.log('Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({email: 'instructor@example.com', password: 'password123'})
    });
    
    const loginData = await loginResponse.json();
    console.log('Login:', loginData.status, loginData.message || '');
    
    if (!loginData.token) {
      console.log('No token received, cannot proceed');
      return;
    }
    
    console.log('Token received successfully');
    
    // Test grading queue
    console.log('\nTesting grading queue...');
    const queueResponse = await fetch('http://localhost:5000/api/instructor/grading/queue', {
      headers: {'Authorization': 'Bearer ' + loginData.token}
    });
    
    const queueData = await queueResponse.json();
    console.log('Queue status:', queueData.status);
    
    if (queueData.data && queueData.data.results) {
      console.log('Queue results:', queueData.data.results.length, 'items');
      queueData.data.results.forEach((result, i) => {
        console.log('  Result', i+1, '- Status:', result.status, 'Student:', result.student);
      });
    } else {
      console.log('No results data:', queueData);
    }
    
    // Test grading stats
    console.log('\nTesting grading stats...');
    const statsResponse = await fetch('http://localhost:5000/api/instructor/grading/stats', {
      headers: {'Authorization': 'Bearer ' + loginData.token}
    });
    
    const statsData = await statsResponse.json();
    console.log('Stats status:', statsData.status);
    
    if (statsData.data && statsData.data.stats) {
      const stats = statsData.data.stats;
      console.log('  Pending grading:', stats.pendingGrading);
      console.log('  Total graded:', stats.totalGraded);
      console.log('  In progress:', stats.inProgressResults);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testAPI();