import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvnyiinrmfysabsfztii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  console.log('Checking database structure...');
  
  try {
    // Try to get the structure by doing a select with limit
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying users table:', error);
    } else {
      console.log('Users table query successful');
      if (data && data.length > 0) {
        console.log('Sample user record columns:', Object.keys(data[0]));
      } else {
        console.log('No users found in table');
      }
    }
    
    // Try to create a test user to see what columns are accepted
    console.log('\nTesting user creation...');
    const testResult = await supabase
      .from('users')
      .insert([{
        username: 'test_user_' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        first_name: 'Test',
        last_name: 'User',
        password: 'test123',
        role: 'user',
        balance: '0',
        is_active: true,
        is_verified: true
      }])
      .select()
      .single();
    
    if (testResult.error) {
      console.error('Test user creation error:', testResult.error);
    } else {
      console.log('Test user created successfully:', Object.keys(testResult.data));
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('id', testResult.data.id);
      console.log('Test user cleaned up');
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabaseStructure();
