"use client";
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  useEffect(() => {
    // The Supabase Client SDK automatically handles the OAuth code exchange
    // when this page loads. We just need to listen for the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // Successfully logged in via Google.
        // Redirect to Login page, which acts as our "Traffic Controller"
        window.location.href = '/login';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-500 font-bold">Completing Secure Sign-In...</p>
      </div>
    </div>
  );
}