"use client";
// ✅ CTO FIX: Switched to Shared Cookie Client to sync with Middleware
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Crown } from 'lucide-react'; 
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 🛑 REMOVED: Manual process.env client (This was causing the Auth Loop)
// const supabase = createClient(...) 

export default function RoleSelection() {
  // ✅ Initialize the Cookie-Sync Client
  const supabase = createClient();
  
  const [selectedRole, setSelectedRole] = useState<'BUSINESS' | 'CREATOR' | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      // 🔒 HARDENING: Prevent Role Re-selection
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && profile.role !== 'UNASSIGNED') {
         // Role is already locked. Redirect.
         // ✅ CTO FIX: Updated path to match your folder 'buisness'
         if (profile.role === 'BUSINESS') window.location.href = '/onboarding/buisness';
         else if (profile.role === 'CREATOR') window.location.href = '/onboarding/creator';
         else if (profile.role === 'ADMIN') window.location.href = '/admin';
      } else {
         setCheckingRole(false);
      }
    }
    init();
  }, []);

  async function handleConfirmRole() {
    if (!selectedRole || !user) return;
    setLoading(true);

    // 1. Update Profile in DB (Saves as 'BUSINESS' internally)
    const { error } = await supabase
      .from('profiles')
      .update({ role: selectedRole })
      .eq('id', user.id);

    if (error) {
      alert("Error setting role: " + error.message);
      setLoading(false);
      return;
    }

    // 2. Redirect to correct onboarding folder
    if (selectedRole === 'BUSINESS') {
      // ✅ CTO FIX: Updated path to match your folder 'buisness'
      window.location.href = '/onboarding/buisness';
    } else {
      window.location.href = '/onboarding/creator';
    }
  }

  if (checkingRole) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Verifying Identity...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Choose Your Path</h1>
          <p className="text-slate-500 text-lg">How will you operate within the ecosystem?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OPTION 1: BRAND (Internally 'BUSINESS') */}
          <Card 
            className={`p-8 cursor-pointer transition-all border-2 relative hover:shadow-xl ${selectedRole === 'BUSINESS' ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-300'}`}
            onClick={() => setSelectedRole('BUSINESS')}
          >
            {selectedRole === 'BUSINESS' && <div className="absolute top-4 right-4 text-slate-900"><CheckCircle2 /></div>}
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-700">
               {/* Crown/Brand Icon */}
               <Crown size={24} />
            </div>
            {/* UI SAYS BRAND */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">I am a Brand</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              For businesses, retailers, and agencies looking to launch campaigns and hire creators.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">✓ Launch Ad Campaigns</li>
              <li className="flex items-center gap-2">✓ Hire Creators & Influencers</li>
              <li className="flex items-center gap-2">✓ Manage Brand Assets</li>
            </ul>
          </Card>

          {/* OPTION 2: CREATOR */}
          <Card 
            className={`p-8 cursor-pointer transition-all border-2 relative hover:shadow-xl ${selectedRole === 'CREATOR' ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-300'}`}
            onClick={() => setSelectedRole('CREATOR')}
          >
            {selectedRole === 'CREATOR' && <div className="absolute top-4 right-4 text-slate-900"><CheckCircle2 /></div>}
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-700 font-bold text-xl">
               C
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">I am a Creator</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              For influencers, content creators, and media owners selling ad inventory.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">✓ Monetize your audience</li>
              <li className="flex items-center gap-2">✓ List ad inventory</li>
              <li className="flex items-center gap-2">✓ Get Brand Deals</li>
            </ul>
          </Card>

        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-end">
            <Button 
                onClick={handleConfirmRole}
                disabled={!selectedRole || loading}
                className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-lg transition-all"
            >
                {loading ? "Initializing..." : "Confirm & Continue →"}
            </Button>
        </div>

      </div>
    </div>
  );
}