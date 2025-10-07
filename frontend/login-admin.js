// Quick script to login as admin and save token for testing
const API_URL = 'http://localhost:5000/api';

async function loginAdmin() {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin2@example.com',
        password: 'Admin123!'
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      // Save to localStorage
      localStorage.setItem('exam_token', data.data.token);
      localStorage.setItem('exam_user', JSON.stringify(data.data.user));
      
      console.log('✅ Admin logged in successfully!');
      console.log('Token saved to localStorage');
      console.log('User role:', data.data.user.role);
      
      // Redirect to admin dashboard
      window.location.href = '/admin/dashboard';
    } else {
      console.error('❌ Login failed:', data);
    }
  } catch (error) {
    console.error('❌ Error during login:', error);
  }
}

// Auto-run when page loads
if (typeof window !== 'undefined') {
  loginAdmin();
} else {
  console.log('This script should be run in the browser console or as a browser script');
}