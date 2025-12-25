"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Target, Users, ShieldCheck, Briefcase, 
  ExternalLink, Zap, FileText, Bell, CheckCircle2, AlertCircle 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BrandDashboard() {
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<any>(null);
  
  // KPI State
  const [stats, setStats] = useState({
    matchCount: 0,
    activeCampaigns: 0, // Placeholder for future system
    pendingProposals: 0,
    activeAgreements: 0
  });

  // Activity Feed State
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    // 1. Verify Brand Access
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (!business || business.verification_status !== 'APPROVED') {
      window.location.href = '/onboarding/pending';
      return;
    }
    setBrand(business);

    // 2. FETCH KPI DATA (Parallel Requests)
    const [matches, intents, agreements] = await Promise.all([
        // A. Matches (Score >= 60)
        supabase.from('match_scores')
            .select('id, final_score, created_at:calculated_at', { count: 'exact' })
            .eq('business_id', business.id)
            .gte('final_score', 60),
            
        // B. Pending Proposals (Incoming)
        supabase.from('co_branding_intents')
            .select('id, created_at, status', { count: 'exact' })
            .eq('receiver_business_id', business.id)
            .eq('status', 'PENDING'),

        // C. Active Agreements
        supabase.from('co_branding_agreements')
            .select('id, started_at, status', { count: 'exact' })
            .or(`brand_a_id.eq.${business.id},brand_b_id.eq.${business.id}`)
            .eq('status', 'ACTIVE')
    ]);

    setStats({
        matchCount: matches.count || 0,
        activeCampaigns: 0, // Placeholder
        pendingProposals: intents.count || 0,
        activeAgreements: agreements.count || 0
    });

    // 3. CONSTRUCT ACTIVITY FEED (Client-Side Merge)
    // We combine recent events from different systems into one timeline
    const recentMatches = (matches.data || []).slice(0, 5).map(m => ({
        type: 'MATCH',
        text: `New High-Value Creator Match (${m.final_score}%)`,
        date: new Date(m.created_at),
        link: '/brand/discover'
    }));

    const recentProposals = (intents.data || []).slice(0, 5).map(i => ({
        type: 'PROPOSAL',
        text: 'You received a new Co-Branding Proposal',
        date: new Date(i.created_at),
        link: '/brand/cobranding/discover' // Will point to inbox later
    }));

    const recentAgreements = (agreements.data || []).slice(0, 5).map(a => ({
        type: 'AGREEMENT',
        text: 'Co-Branding Agreement Started',
        date: new Date(a.started_at),
        link: '/brand/cobranding/settings' // Will point to console later
    }));

    // Merge and Sort by Date DESC
    const combinedFeed = [...recentMatches, ...recentProposals, ...recentAgreements]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10);

    setFeed(combinedFeed);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 1. TOP NAV */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold">B</div>
                <span className="font-bold text-lg tracking-tight">Mission Control</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500 hidden md:inline">{brand.business_name}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50">Sign Out</Button>
            </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 2. KPI STRIP (REAL-TIME) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard 
                title="Creator Matches" 
                value={stats.matchCount} 
                icon={<Users size={18} className="text-blue-600"/>} 
                sub="Score > 60%"
                action={() => window.location.href='/brand/discover'}
            />
            <KpiCard 
                title="Pending Proposals" 
                value={stats.pendingProposals} 
                icon={<Bell size={18} className="text-orange-600"/>} 
                sub="Action Required"
                action={() => window.location.href='/brand/cobranding/discover'} // Temporary link
            />
             <KpiCard 
                title="Active Agreements" 
                value={stats.activeAgreements} 
                icon={<FileText size={18} className="text-green-600"/>} 
                sub="In Progress"
                action={() => window.location.href='/brand/cobranding/settings'} // Temporary link
            />
            <KpiCard 
                title="Active Campaigns" 
                value={stats.activeCampaigns} 
                icon={<Zap size={18} className="text-purple-600"/>} 
                sub="Live Ads"
                action={() => {}} // No action yet
                disabled
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 3. PRIMARY ACTIONS (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Target size={20}/> Core Operations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DISCOVERY */}
                    <ActionCard 
                        title="Find Creators"
                        desc="AI-ranked creators matched to your niche."
                        icon={<Users size={24} className="text-blue-600"/>}
                        link="/brand/discover"
                        cta="View Matches"
                    />
                    {/* TARGETING */}
                    <ActionCard 
                        title="Configure Targeting"
                        desc="Adjust budget, regions, and niches."
                        icon={<Target size={24} className="text-indigo-600"/>}
                        link="/brand/preferences"
                        cta="Update Preferences"
                    />
                    {/* CO-BRANDING DISCOVERY */}
                    <ActionCard 
                        title="Find Partners"
                        desc="Collaborate with verified non-competing brands."
                        icon={<Briefcase size={24} className="text-green-600"/>}
                        link="/brand/cobranding/discover"
                        cta="Browse Partners"
                    />
                    {/* CO-BRANDING SETTINGS */}
                    <ActionCard 
                        title="Co-Branding Menu"
                        desc="Manage your collaboration visibility & offers."
                        icon={<ShieldCheck size={24} className="text-emerald-600"/>}
                        link="/brand/cobranding/settings"
                        cta="Manage Settings"
                    />
                </div>

                {/* ACTIVITY FEED */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Bell size={18}/> Live Activity
                    </h3>
                    <div className="space-y-4">
                        {feed.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center italic">No recent activity.</p>
                        ) : (
                            feed.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0"></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{item.text}</p>
                                        <p className="text-xs text-slate-500">{item.date.toLocaleDateString()}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="ml-auto text-xs h-6" onClick={() => window.location.href=item.link}>
                                        View
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 4. ACCOUNT HEALTH (1/3 Width) */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={20}/> Account Health
                </h2>
                <Card>
                    <CardContent className="p-6 space-y-6">
                        {/* Verification */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Verification</span>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                        </div>
                        
                        {/* Co-Branding Status */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Co-Branding</span>
                            {brand.co_branding_enabled ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                            ) : (
                                <Badge variant="secondary">Disabled</Badge>
                            )}
                        </div>

                        {/* Violations */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Violations</span>
                            <span className={`text-sm font-bold ${brand.co_branding_violation_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {brand.co_branding_violation_count || 0}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                             <div className="flex gap-3 items-center mb-2">
                                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                                    <Briefcase size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Legal Entity</p>
                                    <p className="text-xs text-slate-500">{brand.legal_entity_name}</p>
                                </div>
                             </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Tips */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                        <AlertCircle size={14}/> Pro Tip
                    </h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                        Brands with specific niche targeting get 3x more accurate creator matches. Check your preferences.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

// HELPER COMPONENTS
function KpiCard({ title, value, icon, sub, action, disabled }: any) {
    return (
        <Card className={`border-slate-200 shadow-sm transition-all ${!disabled ? 'hover:border-slate-300 cursor-pointer' : 'opacity-60'}`} onClick={!disabled ? action : undefined}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</span>
                    {icon}
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{value}</div>
                <div className="text-xs text-slate-400 mt-1">{sub}</div>
            </CardContent>
        </Card>
    )
}

function ActionCard({ title, desc, icon, link, cta }: any) {
    return (
        <Card className="hover:shadow-md transition-all border-slate-200 group cursor-pointer" onClick={() => window.location.href=link}>
            <CardContent className="p-6">
                <div className="mb-4 bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    {icon}
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 mb-4 h-10">{desc}</p>
                <div className="flex items-center text-sm font-bold text-slate-900 group-hover:underline">
                    {cta} <ExternalLink size={14} className="ml-2 opacity-50"/>
                </div>
            </CardContent>
        </Card>
    )
}