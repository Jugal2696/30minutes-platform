"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BrandDashboard() {
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<any>(null);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // 🔒 SECURITY BOUNCER
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (!business) {
         window.location.href = '/onboarding/brand';
         return;
      }

      if (business.verification_status !== 'APPROVED') {
         // NOT APPROVED? BACK TO JAIL.
         window.location.href = '/onboarding/pending';
         return;
      }

      setBrand(business);
      setLoading(false);
    }
    checkAccess();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold">B</div>
           <span className="font-bold">Brand Control</span>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="text-red-500 hover:bg-red-50">Sign Out</Button>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-2">Welcome, {brand.business_name}</h1>
        <p className="text-slate-500 mb-8">Campaign Manager Loading...</p>
      </div>
    </div>
  );
}