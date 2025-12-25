"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LayoutDashboard, BarChart3, Wallet } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<any>(null);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // 🔒 SECURITY BOUNCER: Check Verification Status
      const { data: creatorProfile } = await supabase
        .from('creators')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (!creatorProfile) {
         // No profile found? Go to onboarding.
         window.location.href = '/onboarding/creator';
         return;
      }

      if (creatorProfile.verification_status !== 'APPROVED') {
         // Not Approved? GO TO JAIL.
         window.location.href = '/onboarding/pending';
         return;
      }

      // If we get here, they are APPROVED.
      setCreator(creatorProfile);
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
      {/* NAV */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold">C</div>
           <span className="font-bold">Creator Studio</span>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="text-red-500 hover:bg-red-50">Sign Out</Button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-2">Welcome, {creator.channel_name}</h1>
        <p className="text-slate-500 mb-8">Manage your inventory and incoming offers.</p>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Followers</CardTitle>
                    <UserSquare2 className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{creator.total_followers.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Avg. Reach</CardTitle>
                    <BarChart3 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{creator.average_reach.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Active Deals</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-slate-500">No active campaigns</p>
                </CardContent>
            </Card>
        </div>

        {/* PLACEHOLDER CONTENT */}
        <div className="bg-white p-12 rounded-lg border border-dashed border-slate-300 text-center">
            <p className="text-slate-400 font-medium">Your Inventory Manager is coming in System 3.</p>
        </div>
      </div>
    </div>
  );
}

// Helper Icon Component
function UserSquare2({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>;
}