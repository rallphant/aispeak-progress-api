// TEMPORARY SCRIPT TO GET A JWT (e.g., run with ts-node or in browser)
// Make sure to replace with your actual Supabase URL, anon key, and user credentials
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxdiobphbexefaioxblk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZGlvYnBoYmV4ZWZhaW94YmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTQ4NzYsImV4cCI6MjA2NTgzMDg3Nn0.7sGnFyeTkezjDNtmatKuTmzeyjvJDxJJ7IZ3hSqgaJ0'; // Use ANON key for client-side auth
const USER_EMAIL = 'user@user.com';
const USER_PASSWORD = 'user';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getToken() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });
    if (error) throw error;
    console.log('Access Token:', data.session.access_token);
    console.log('User ID:', data.user.id);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error signing in:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}
getToken();
