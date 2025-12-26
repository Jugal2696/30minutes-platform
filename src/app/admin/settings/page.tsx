"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Settings as SettingsIcon, Palette, Globe } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlatformSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    site_name: '',
    primary_color: '',
    logo_url: '',
    support_email: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    // 1. RBAC Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    // We fetch the singleton settings row (ID=1)
    const { data } = await supabase.from('platform_settings').select('*').single();
    if (data) {
        setConfig({
            site_name: data.site_name || '30Minutes',
            primary_color: data.primary_color || '#0f172a',
            logo_url: data.logo_url || '',
            support_email: 'support@30minutes.in' // Placeholder if not in DB yet
        });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    // Upsert ID 1 to ensure it exists
    const { error } = await supabase.from('platform_settings').upsert({ id: 1, ...config });
    
    if (error) {
        alert("Error: " + error.message);
    } else {
        // Audit Log
        await supabase.rpc('log_admin_action', { 
            p_action: 'UPDATE_SETTINGS', 
            p_resource: 'platform_settings', 
            p_target_id: '1', 
            p_details: config 
        });
        alert("Settings Saved!");
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Platform Settings</h1>
                    <p className="text-slate-400">Configure global identity and branding.</p>
                </div>
            </div>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                {saving ? <Loader2 className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>} Save Config
            </Button>
        </div>

        <div className="grid gap-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Globe size={18}/> Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Site Name</label>
                        <Input 
                            className="bg-slate-950 border-slate-800 text-white mt-1"
                            value={config.site_name}
                            onChange={e => setConfig({...config, site_name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Logo URL</label>
                        <div className="flex gap-4">
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white mt-1 flex-1"
                                value={config.logo_url}
                                onChange={e => setConfig({...config, logo_url: e.target.value})}
                                placeholder="https://..."
                            />
                            {config.logo_url && (
                                <div className="h-10 w-10 bg-white rounded flex items-center justify-center p-1 mt-1">
                                    <img src={config.logo_url} alt="Logo" className="max-h-full max-w-full" />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Palette size={18}/> Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Primary Color (Hex)</label>
                        <div className="flex gap-4 items-center mt-1">
                            <div className="h-10 w-10 rounded border border-slate-700 shadow-sm" style={{ backgroundColor: config.primary_color }}></div>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white font-mono"
                                value={config.primary_color}
                                onChange={e => setConfig({...config, primary_color: e.target.value})}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}