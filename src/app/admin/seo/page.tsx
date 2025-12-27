"use client";
import { useEffect, useState } from 'react';
// ✅ UPDATE: Switched to internal Cookie Client to prevent auth loops
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Search, FileCode, Bot, Sparkles, BrainCircuit } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function SEOCenter() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    meta_title: '',
    meta_description: '',
    ai_summary: '', // 🤖 NEW: For LLM/GEO extraction
    organization_schema: '', // 🕸️ NEW: For Machine-readable Entity Graph
    default_og_image: '',
    robots_txt: '',
    sitemap_enabled: true
  });

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    // 1. ✅ UPDATE: GOD-MODE RBAC Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // If role is not SUPER_ADMIN or ADMIN, kick back to OS
    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
        window.location.href = '/admin';
        return;
    }

    fetchConfig();
  }

  async function fetchConfig() {
    const { data } = await supabase.from('platform_settings').select('*').single();
    if (data) {
        setConfig({
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            ai_summary: data.ai_summary || '', // NEW
            organization_schema: data.organization_schema || '', // NEW
            default_og_image: data.default_og_image || '',
            robots_txt: data.robots_txt || 'User-agent: * Disallow:',
            sitemap_enabled: data.sitemap_enabled ?? true
        });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    // ✅ UPDATE: Use explicit update to ID 1 for singleton settings
    const { error } = await supabase.from('platform_settings').update(config).eq('id', 1);
    
    await supabase.rpc('log_admin_action', { 
        p_action: 'UPDATE_SEO_LLM', 
        p_resource: 'platform_settings', 
        p_target_id: '1', 
        p_details: { meta_title: config.meta_title } 
    });

    setSaving(false);
    if (!error) {
        alert("SEO & LLM Configuration Updated!");
    } else {
        alert("Error saving: " + error.message);
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
                        <BrainCircuit className="text-purple-400" /> SEO & LLM Command
                    </h1>
                    <p className="text-slate-500 font-mono text-xs uppercase">Answer Engine & Indexing Control</p>
                </div>
            </div>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 shadow-lg shadow-purple-900/20">
                {saving ? <Loader2 className="animate-spin mr-2"/> : <Sparkles size={16} className="mr-2"/>} Sync AI Core
            </Button>
        </div>

        <div className="grid gap-6">
            {/* 🤖 LLM ANSWER ENGINE BLOCK */}
            <Card className="bg-slate-900 border-purple-900/30">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Bot size={18} className="text-purple-400"/> AI Answer Engine (TL;DR)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-[10px] text-slate-500 italic uppercase tracking-widest">Optimized for ChatGPT, Gemini, and Perplexity extraction</p>
                    <textarea 
                        className="w-full bg-slate-950 border border-slate-800 text-purple-200 mt-1 rounded p-3 text-sm min-h-[100px] focus:ring-1 focus:ring-purple-500 outline-none font-sans"
                        placeholder="Define 30Minutes Market in 2-3 declarative sentences..."
                        value={config.ai_summary}
                        onChange={e => setConfig({...config, ai_summary: e.target.value})}
                    />
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Search size={18} className="text-blue-400"/> Global Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Default Meta Title</label>
                        <Input 
                            className="bg-slate-950 border-slate-800 text-white mt-1 focus:ring-blue-500"
                            value={config.meta_title}
                            onChange={e => setConfig({...config, meta_title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Default Meta Description</label>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 text-white mt-1 rounded p-2 text-sm min-h-[80px] focus:ring-1 focus:ring-blue-500 outline-none"
                            value={config.meta_description}
                            onChange={e => setConfig({...config, meta_description: e.target.value})}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><FileCode size={18} className="text-green-400"/> Machine-Readable Graph (JSON-LD)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Organization Schema</label>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 text-green-200 mt-1 rounded p-2 text-xs font-mono min-h-[120px] focus:ring-1 focus:ring-green-500 outline-none"
                            placeholder='{ "@context": "https://schema.org", ... }'
                            value={config.organization_schema}
                            onChange={e => setConfig({...config, organization_schema: e.target.value})}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><FileCode size={18} className="text-slate-400"/> Robots & Sitemaps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Robots.txt</label>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 text-white mt-1 rounded p-2 text-sm font-mono min-h-[100px] focus:ring-1 focus:ring-slate-500 outline-none"
                            value={config.robots_txt}
                            onChange={e => setConfig({...config, robots_txt: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-4 rounded border border-slate-800">
                        <div>
                            <p className="font-bold text-white">Enable Sitemap.xml</p>
                            <p className="text-xs text-slate-500">Auto-generate sitemap for all published CMS pages.</p>
                        </div>
                        <Switch checked={config.sitemap_enabled} onCheckedChange={c => setConfig({...config, sitemap_enabled: c})} />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}