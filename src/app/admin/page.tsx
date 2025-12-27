"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, LayoutTemplate, Users, ShieldCheck, Globe, 
  Settings, Zap, FileText, ArrowRight, ExternalLink 
} from 'lucide-react';

export default function AdminOS() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ businesses: 0, creators: 0 });

  // 🛑 MAPPED EXACTLY TO YOUR SCREENSHOT FOLDERS
  const modules = [
    { 
      label: 'CMS Engine', 
      desc: 'Manage navigation & pages',
      icon: <LayoutTemplate size={24} />, 
      route: '/admin/cms/navigation',  // Matches your 'cms' folder
      category: 'CONTENT'
    },
    { 
      label: 'User Database', 
      desc: 'Manage all profiles',
      icon: <Users size={24} />, 
      route: '/admin/users', // Matches your 'users' folder
      category: 'SYSTEM'
    },
    { 
      label: 'Verification Queue', 
      desc: 'Approve pending requests',
      icon: <ShieldCheck size={24} />, 
      route: '/admin/verification', // Matches your 'verification' folder
      category: 'SECURITY'
    },
    { 
      label: 'SEO Manager', 
      desc: 'Meta tags & sitemap',
      icon: <Globe size={24} />, 
      route: '/admin/seo', // Matches your 'seo' folder
      category: 'MARKETING'
    },
    { 
      label: 'Feature Flags', 
      desc: 'Toggle system features',
      icon: <Zap size={24} />, 
      route: '/admin/features', // Matches your 'features' folder
      category: 'DEV'
    },
    { 
      label: 'Legal Documents', 
      desc: 'Terms & Privacy updates',
      icon: <FileText size={24} />, 
      route: '/admin/legal', // Matches your 'legal' folder
      category: 'LEGAL'
    },
    { 
      label: 'Global Settings', 
      desc: 'Platform configuration',
      icon: <Settings size={24} />, 
      route: '/admin/settings', // Matches your 'settings' folder
      category: 'SYSTEM'
    }
  ];

  useEffect(() => {
    checkAccess();
    fetchStats();
  }, []);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
         window.location.href = '/dashboard/business';
    }
  }

  async function fetchStats() {
    try {
        const { count: bCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
        const { count: cCount } = await supabase.from('creators').select('*', { count: 'exact', head: true }); // Assuming table exists
        setStats({ businesses: bCount || 0, creators: cCount || 0 });
    } catch (e) {
        console.log("Stats error", e);
    }
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-slate-800 pb-6">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2">30MINUTES GOD MODE</h1>
                <p className="text-slate-400 font-mono text-sm">ARCHITECT VIEW // SUPER ADMIN</p>
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
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Businesses</p>
                <p className="text-3xl font-mono font-bold text-white mt-2">{stats.businesses}</p>
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

        {/* THE MODULE GRID (Linked to your folders) */}
        <div>
            <h2 className="text-xl font-bold text-white mb-6">System Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {modules.map((mod, i) => (
                    <Card 
                        key={i} 
                        className="bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer group"
                        onClick={() => window.location.href = mod.route}
                    >
                        <CardHeader className="pb-4 pt-6">
                            <div className="flex justify-between items-start">
                                <div className="h-14 w-14 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
                                    {mod.icon}
                                </div>
                                <ArrowRight className="text-slate-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-lg text-white mb-1 group-hover:text-blue-100">{mod.label}</CardTitle>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-1">{mod.desc}</p>
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400"></span>
                                <p className="text-xs text-slate-500 font-mono uppercase group-hover:text-slate-300">{mod.category}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}