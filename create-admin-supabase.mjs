const supabaseUrl = 'https://wvnyiinrmfysabsfztii.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MzI1MzUsImV4cCI6MjA1MjMwODUzNX0.4c2IjOkGjKFhUIFxSKUlXlgOdojZMQfr2wPFuvJMNR8';

async function createAdminUser() {
  try {
    // Check if admin user exists
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/users?username=eq.admin`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    const existingUsers = await checkResponse.json();
    console.log('Existing admin users:', existingUsers);

    if (existingUsers.length === 0) {
      console.log('Creating admin user...');
      
      // Create admin user
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          username: 'admin',
          email: 'admin@axixfinance.com',
          firstName: 'Admin',
          lastName: 'User',
          isVerified: true,
          isActive: true,
          role: 'admin',
          balance: '0'
        })
      });

      const newUser = await createResponse.json();
      console.log('Admin user created:', newUser);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
