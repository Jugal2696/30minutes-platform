"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // ✅ Uses Cookie Client
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Target, Users, ShieldCheck, Briefcase, 
  ExternalLink, Zap, FileText, Bell, AlertTriangle
} from 'lucide-react';

export default function BusinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  // ✅ Initialize Client
  const supabase = createClient();

  // KPI State
  const [stats, setStats] = useState({
    matchCount: 0,
    activeCampaigns: 0, 
    pendingProposals: 0,
    activeAgreements: 0
  });

  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    console.log("DASHBOARD: Starting Init...");
    
    // 1. GET USER (Check Cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        window.location.href = '/login'; 
        return; 
    }

    console.log("DASHBOARD: User Found:", user.id);

    // 2. GET BUSINESS PROFILE
    // We check if the user has a profile linked to their ID
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (bizError) {
        console.error("DASHBOARD DB ERROR:", bizError);
    }

    // 🛑 LOGIC GATE: AUTO-REDIRECTS (No UI Card)
    
    // CASE A: No Profile Data -> Send to Role Selection
    if (!bizData) {
        console.log("No profile found, redirecting to onboarding...");
        window.location.href = '/onboarding/role-selection';
        return;
    }

    // CASE B: Pending Verification -> Send to Pending Page
    if (bizData.verification_status === 'PENDING') {
        console.log("Profile pending, redirecting...");
        window.location.href = '/onboarding/pending';
        return;
    }

    // CASE C: Rejected or Incomplete -> Send to Business Form (using your specific folder spelling)
    if (bizData.verification_status !== 'APPROVED') {
        console.log("Profile incomplete, redirecting to form...");
        window.location.href = '/onboarding/buisness'; // ⚠️ Matches your folder spelling
        return;
    }

    // CASE D: APPROVED -> Load Mission Control
    setBusiness(bizData);

    // 3. FETCH KPI DATA (Only runs if APPROVED)
    try {
        const [matches, intents, agreements] = await Promise.all([
            supabase.from('match_scores').select('id, final_score, calculated_at', { count: 'exact' }).eq('business_id', bizData.id).gte('final_score', 60),
            supabase.from('co_branding_intents').select('id, created_at, status', { count: 'exact' }).eq('receiver_business_id', bizData.id).eq('status', 'PENDING'),
            supabase.from('co_branding_agreements').select('id, started_at, status', { count: 'exact' }).or(`brand_a_id.eq.${bizData.id},brand_b_id.eq.${bizData.id}`).eq('status', 'ACTIVE')
        ]);

        setStats({
            matchCount: matches.count || 0,
            activeCampaigns: 0, 
            pendingProposals: intents.count || 0,
            activeAgreements: agreements.count || 0
        });

        const recentMatches = (matches.data || []).slice(0, 5).map(m => ({
            type: 'MATCH', text: `New Match (${m.final_score}%)`, date: new Date(m.calculated_at), link: '/dashboard/business/discover'
        }));
        const recentProposals = (intents.data || []).slice(0, 5).map(i => ({
            type: 'PROPOSAL', text: 'New Proposal', date: new Date(i.created_at), link: '/dashboard/business/inbox'
        }));
        const recentAgreements = (agreements.data || []).slice(0, 5).map(a => ({
            type: 'AGREEMENT', text: 'Agreement Started', date: new Date(a.started_at), link: '/dashboard/business/agreements'
        }));

        const combinedFeed = [...recentMatches, ...recentProposals, ...recentAgreements]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 10);

        setFeed(combinedFeed);

    } catch (err: any) {
        console.error("Stats Error:", err);
    }

    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  // Loading Spinner acts as the "Redirecting..." state
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-900 h-8 w-8 mb-2" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying Clearance...</p>
    </div>
  );

  // 🚀 MISSION CONTROL (Only renders for APPROVED users)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 🛑 DEBUG BANNER */}
      {debugError && (
          <div className="bg-red-600 text-white p-4 font-bold text-center sticky top-0 z-[100] shadow-md flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>SYSTEM: {debugError}</span>
          </div>
      )}

      {/* 1. TOP NAV */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold">B</div>
                <span className="font-bold text-lg tracking-tight">Mission Control</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500 hidden md:inline">{business?.business_name}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50">Sign Out</Button>
            </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 2. KPI STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Creator Matches" value={stats.matchCount} icon={<Users size={18} className="text-blue-600"/>} sub="Score > 60%" action={() => window.location.href='/dashboard/business/discover'}/>
            <KpiCard title="Pending Proposals" value={stats.pendingProposals} icon={<Bell size={18} className="text-orange-600"/>} sub="Action Required" action={() => window.location.href='/dashboard/business/inbox'}/>
             <KpiCard title="Active Agreements" value={stats.activeAgreements} icon={<FileText size={18} className="text-green-600"/>} sub="In Progress" action={() => window.location.href='/dashboard/business/agreements'}/>
            <KpiCard title="Active Campaigns" value={stats.activeCampaigns} icon={<Zap size={18} className="text-purple-600"/>} sub="Live Ads" action={() => {}} disabled/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Target size={20}/> Core Operations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionCard title="Find Creators" desc="AI-ranked creators matched to your niche." icon={<Users size={24} className="text-blue-600"/>} link="/dashboard/business/discover" cta="View Matches"/>
                    <ActionCard title="Configure Targeting" desc="Adjust budget, regions, and niches." icon={<Target size={24} className="text-indigo-600"/>} link="/dashboard/business/preferences" cta="Update Preferences"/>
                    <ActionCard title="Find Partners" desc="Collaborate with verified non-competing brands." icon={<Briefcase size={24} className="text-green-600"/>} link="/dashboard/business/cobranding" cta="Browse Partners"/>
                    <ActionCard title="Co-Branding Menu" desc="Manage your collaboration visibility & offers." icon={<ShieldCheck size={24} className="text-emerald-600"/>} link="/dashboard/business/settings" cta="Manage Settings"/>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck size={20}/> Account Health</h2>
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-600">Verification</span><Badge className="bg-green-100 text-green-700 border-none font-bold">VERIFIED</Badge></div>
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-600">Co-Branding</span>{business?.co_branding_enabled ? <Badge className="bg-green-100 text-green-700 border-none font-bold">ACTIVE</Badge> : <Badge variant="secondary">DISABLED</Badge>}</div>
                        <div className="pt-4 border-t border-slate-100">
                             <div className="flex gap-3 items-center mb-2">
                                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><Briefcase size={18} /></div>
                                <div><p className="text-sm font-bold text-slate-900">Legal Entity</p><p className="text-xs text-slate-500">{business?.legal_entity_name || "N/A"}</p></div>
                             </div>
                        </div>
                    </CardContent>
                </Card>
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
                <div className="flex justify-between items-start mb-2"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</span>{icon}</div>
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
                <div className="mb-4 bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-slate-100 transition-colors">{icon}</div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 mb-4 h-10">{desc}</p>
                <div className="flex items-center text-sm font-bold text-slate-900 group-hover:underline">{cta} <ExternalLink size={14} className="ml-2 opacity-50"/></div>
            </CardContent>
        </Card>
    )
}