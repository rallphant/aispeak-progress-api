// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using the service_role key for backend operations

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined in environment variables. Please set SUPABASE_URL.");
}
if (!supabaseKey) {
  throw new Error("Supabase service key is not defined in environment variables. Please set SUPABASE_SERVICE_KEY.");
}

// Creating a single supabase client for interacting with the database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Seting autoRefreshToken to false for server-side operations
    // as we are using a service_role key that doesn't expire.
    autoRefreshToken: false,
    persistSession: false,
    // detectSessionInUrl: false, // Only relevant for client-side auth
  }
});

console.log('Supabase client initialized.');
