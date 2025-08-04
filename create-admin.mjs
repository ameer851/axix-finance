import fetch from 'node-fetch';

const SUPABASE_URL = 'https://wvnyiinrmfysabsfztii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MzI1MzUsImV4cCI6MjA1MjMwODUzNX0.4c2IjOkGjKFhUIFxSKUlXlgOdojZMQfr2wPFuvJMNR8';

async function createAdminUser() {
  try {
    // First check if admin user already exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.admin`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const existingUsers = await checkResponse.json();
    
    if (existingUsers.length > 0) {
      console.log('Admin user already exists:', existingUsers[0]);
      return;
    }

    // Create admin user
    const adminUser = {
      username: 'admin',
      email: 'admin@axixfinance.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      balance: '0',
      isActive: true,
      isVerified: true, // Always verified
      twoFactorEnabled: false,
      referredBy: null,
      bitcoinAddress: null,
      bitcoinCashAddress: null,
      ethereumAddress: null,
      bnbAddress: null,
      usdtTrc20Address: null
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(adminUser)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create admin user: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log('Admin user created successfully:', result);

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
      const insertResult = await client`
        INSERT INTO users (username, email, "firstName", "lastName", "isVerified", "isActive", role, balance)
        VALUES (${'admin'}, ${'admin@axixfinance.com'}, ${'Admin'}, ${'User'}, ${true}, ${true}, ${'admin'}, ${'0'})
        RETURNING *
      `;
      console.log('Admin user created:', insertResult);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createAdminUser();
