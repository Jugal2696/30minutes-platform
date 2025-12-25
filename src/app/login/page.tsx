"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // AUTO-ROUTING LOGIC
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already logged in (e.g. from Google). Check role.
        await checkRoleAndRedirect(session.user.id);
      } else {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  async function checkRoleAndRedirect(userId: string) {
    setLoading(true);
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (profile?.role === 'UNASSIGNED') {
        window.location.href = '/onboarding/role-selection';
    } else if (profile?.role === 'BUSINESS') {
        window.location.href = '/dashboard/brand';
    } else if (profile?.role === 'CREATOR') {
        window.location.href = '/dashboard/creator';
    } else if (profile?.role === 'ADMIN') {
        window.location.href = '/admin';
    } else {
        window.location.href = '/onboarding/role-selection';
    }
  }

  async function handleAuth() {
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Account created! Please check your email to confirm.');
      setLoading(false);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }
      // Use the shared routing function
      await checkRoleAndRedirect(data.user.id);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, 
      },
    });
  }

  if (checkingSession) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-slate-900" />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
             <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
               30
             </div>
          </div>
          <CardTitle className="text-slate-900 text-2xl font-bold tracking-tight">
            {isSignUp ? "Create Your Identity" : "Access Portal"}
          </CardTitle>
          <p className="text-slate-500 text-sm mt-2">
            Enterprise Advertising Ecosystem
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Button 
            onClick={handleGoogleLogin} 
            variant="outline" 
            className="w-full h-12 border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
          >
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or using email</span></div>
          </div>

          <div className="space-y-4">
             <Input 
                type="email" 
                placeholder="work@company.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="h-11 bg-slate-50 border-slate-200 focus:ring-slate-900" 
             />
             <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="h-11 bg-slate-50 border-slate-200 focus:ring-slate-900" 
             />
             <Button 
                onClick={handleAuth} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12" 
                disabled={loading}
             >
                {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
             </Button>
          </div>

          <p className="text-center text-sm text-slate-600">
             {isSignUp ? "Already have an account?" : "New to the platform?"}{" "}
             <span 
                className="font-bold text-slate-900 cursor-pointer hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
             >
                {isSignUp ? "Sign In" : "Register Now"}
             </span>
          </p>

        </CardContent>
      </Card>
    </div>
  );
}