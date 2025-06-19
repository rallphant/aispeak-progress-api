// TEMPORARY SCRIPT TO GET A JWT (e.g., run with ts-node or in browser)
// Make sure to replace with your actual Supabase URL, anon key, and user credentials
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'your-supabase-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key'; // Use ANON key for client-side auth
const USER_EMAIL = 'user-email';
const USER_PASSWORD = 'user-password';

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
