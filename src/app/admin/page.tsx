"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, LayoutDashboard, Settings, Users, FileText, Flag, 
  ShieldAlert, ArrowRight, ExternalLink, Menu, Scale, Globe 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🧠 ICON MAP: Connects DB string to React Component
const iconMap: any = {
  LayoutDashboard: <LayoutDashboard size={24} />,
  Settings: <Settings size={24} />,
  Users: <Users size={24} />,
  FileText: <FileText size={24} />,
  Flag: <Flag size={24} />,
  ShieldAlert: <ShieldAlert size={24} />,
  Menu: <Menu size={24} />,
  Scale: <Scale size={24} />,
  Globe: <Globe size={24} />
};

export default function AdminOS() {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);
  const [stats, setStats] = useState({ brands: 0, creators: 0 });

  useEffect(() => {
    checkAccess();
    fetchModules();
    fetchStats();
  }, []);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    // RBAC Check
    const { data: roleData } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id).single();
    if (roleData?.roles?.name !== 'SUPER_ADMIN') {
         // Fallback for legacy admin
         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         if (profile?.role !== 'ADMIN') window.location.href = '/dashboard/brand';
    }
  }

  async function fetchModules() {
    const { data } = await supabase
        .from('admin_ui_modules')
        .select('*')
        .eq('is_visible', true)
        .neq('route', '/admin') // Don't show "Dashboard" link on Dashboard
        .order('order_index', { ascending: true });
    
    if (data) setModules(data);
  }

  async function fetchStats() {
    const { count: bCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
    const { count: cCount } = await supabase.from('creators').select('*', { count: 'exact', head: true });
    setStats({ brands: bCount || 0, creators: cCount || 0 });
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-slate-800 pb-6">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2">PLATFORM OS</h1>
                <p className="text-slate-400 font-mono text-sm">v4.5.0 // GOD MODE ACTIVE</p>
            </div>
            <div className="flex gap-4">
                 <Button variant="outline" className="text-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white" onClick={() => window.open('/', '_blank')}>
                    View Live Site <ExternalLink size={14} className="ml-2"/>
                </Button>
                <Button variant="destructive" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>
                    Secure Logout
                </Button>
            </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Brands</p>
                <p className="text-3xl font-mono font-bold text-white mt-2">{stats.brands}</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Creators</p>
                <p className="text-3xl font-mono font-bold text-white mt-2">{stats.creators}</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">System Status</p>
                <p className="text-3xl font-mono font-bold text-green-500 mt-2">OPERATIONAL</p>
            </div>
        </div>

        {/* DYNAMIC MODULE GRID */}
        <div>
            <h2 className="text-xl font-bold text-white mb-6">Installed Apps</h2>
            {modules.length === 0 ? (
                <div className="text-slate-500 italic">No modules registered. Run the SQL script.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {modules.map((mod) => (
                        <Card 
                            key={mod.id} 
                            className="bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer group"
                            onClick={() => window.location.href = mod.route}
                        >
                            <CardHeader className="pb-4 pt-6">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
                                        {iconMap[mod.icon] || <LayoutDashboard />}
                                    </div>
                                    <ArrowRight className="text-slate-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" size={20} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-lg text-white mb-1 group-hover:text-blue-100">{mod.label}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400"></span>
                                    <p className="text-xs text-slate-500 font-mono uppercase group-hover:text-slate-300">{mod.category}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}