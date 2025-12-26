"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Search, FileCode } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SEOCenter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    meta_title: '',
    meta_description: '',
    default_og_image: '',
    robots_txt: '',
    sitemap_enabled: true
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    const { data } = await supabase.from('platform_settings').select('*').single();
    if (data) {
        setConfig({
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            default_og_image: data.default_og_image || '',
            robots_txt: data.robots_txt || 'User-agent: * Disallow:',
            sitemap_enabled: true
        });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('platform_settings').update(config).eq('id', 1);
    
    await supabase.rpc('log_admin_action', { 
        p_action: 'UPDATE_SEO', 
        p_resource: 'platform_settings', 
        p_target_id: '1', 
        p_details: { meta_title: config.meta_title } 
    });

    setSaving(false);
    if (!error) alert("SEO Configuration Updated!");
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">SEO Command Center</h1>
                    <p className="text-slate-400">Manage search engine visibility.</p>
                </div>
            </div>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                {saving ? <Loader2 className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>} Apply Changes
            </Button>
        </div>

        <div className="grid gap-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Search size={18}/> Global Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Default Meta Title</label>
                        <Input 
                            className="bg-slate-950 border-slate-800 text-white mt-1"
                            value={config.meta_title}
                            onChange={e => setConfig({...config, meta_title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Default Meta Description</label>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 text-white mt-1 rounded p-2 text-sm min-h-[80px]"
                            value={config.meta_description}
                            onChange={e => setConfig({...config, meta_description: e.target.value})}
                        />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Default OG Image URL</label>
                        <Input 
                            className="bg-slate-950 border-slate-800 text-white mt-1"
                            value={config.default_og_image}
                            onChange={e => setConfig({...config, default_og_image: e.target.value})}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><FileCode size={18}/> Crawling & Indexing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Robots.txt</label>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 text-white mt-1 rounded p-2 text-sm font-mono min-h-[120px]"
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