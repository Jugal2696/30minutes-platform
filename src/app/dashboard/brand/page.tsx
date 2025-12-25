"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, Users, ShieldCheck, Briefcase, ExternalLink } from 'lucide-react';

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
      {/* NAV */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold">B</div>
           <span className="font-bold">Brand Control</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:inline">{brand.business_name}</span>
            <Button variant="ghost" onClick={handleSignOut} className="text-red-500 hover:bg-red-50">Sign Out</Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* HEADER */}
        <div>
            <h1 className="text-3xl font-extrabold mb-2">Command Center</h1>
            <p className="text-slate-500">Manage your campaigns and partnerships.</p>
        </div>

        {/* 1. CAMPAIGN INTELLIGENCE (System 5) */}
        <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-2 text-blue-800">
                    <Target size={24} />
                    <CardTitle className="text-xl">Campaign Intelligence</CardTitle>
                </div>
                <p className="text-blue-600/80 text-sm">AI-driven creator discovery and matching.</p>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">Find the Perfect Voice</h3>
                        <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                            Configure your target audience, budget, and niche. Our scoring engine will rank creators based on verified data compatibility.
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={() => window.location.href='/brand/preferences'} className="bg-slate-900">
                                Configure Targeting
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href='/brand/discover'}>
                                View Matches <ExternalLink size={14} className="ml-2"/>
                            </Button>
                        </div>
                    </div>
                    {/* Visual Placeholder for Stats */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-200 flex flex-col gap-2 opacity-75">
                        <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                        <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                        <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 2. B2B CO-BRANDING (System 6) */}
        <Card className="border-green-100 shadow-sm">
            <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                <div className="flex items-center gap-2 text-green-800">
                    <Briefcase size={24} />
                    <CardTitle className="text-xl">Co-Branding Network</CardTitle>
                </div>
                <p className="text-green-600/80 text-sm">Direct B2B collaborations (Zero cost, High trust).</p>
            </CardHeader>
            <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">Collaborate with Peers</h3>
                        <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                            Unlock new audiences by partnering with non-competing brands. Exchange newsletters, logo placements, or social mentions.
                        </p>
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => window.location.href='/brand/cobranding/settings'} 
                                className="bg-green-700 hover:bg-green-800 text-white border-transparent"
                            >
                                <ShieldCheck size={16} className="mr-2"/> Manage Settings
                            </Button>
                            <Button variant="outline" disabled className="text-slate-400">
                                Browse Partners (Coming Soon)
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
                                <Users size={20} />
                            </div>
                            <p className="text-xs font-bold text-green-700 uppercase">Trust Network</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}