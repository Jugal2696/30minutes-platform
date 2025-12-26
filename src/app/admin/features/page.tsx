"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; 
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ArrowLeft, Flag, AlertTriangle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FeatureFlags() {
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<any[]>([]);
  const [emergency, setEmergency] = useState<any>({});
  const [newFlagKey, setNewFlagKey] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch Flags
    const { data: fData } = await supabase.from('feature_flags').select('*').order('created_at', { ascending: false });
    if (fData) setFlags(fData);

    // Fetch Emergency Controls (Singleton)
    const { data: eData } = await supabase.from('emergency_controls').select('*').single();
    if (eData) setEmergency(eData);

    setLoading(false);
  }

  async function toggleFlag(id: string, currentVal: boolean) {
    const { error } = await supabase.from('feature_flags').update({ is_enabled_globally: !currentVal }).eq('id', id);
    if (!error) {
        setFlags(flags.map(f => f.id === id ? { ...f, is_enabled_globally: !currentVal } : f));
        logAction('TOGGLE_FLAG', id, { enabled: !currentVal });
    }
  }

  async function toggleEmergency(field: string, currentVal: boolean) {
    if (!confirm("⚠️ WARNING: You are toggling a Critical Kill Switch. Are you sure?")) return;
    
    const { error } = await supabase.from('emergency_controls').update({ [field]: !currentVal }).eq('id', emergency.id);
    if (!error) {
        setEmergency({ ...emergency, [field]: !currentVal });
        logAction('EMERGENCY_TOGGLE', 'emergency_controls', { field, value: !currentVal });
    }
  }

  async function createFlag() {
    if (!newFlagKey) return;
    const { data, error } = await supabase.from('feature_flags').insert({
        key: newFlagKey.toLowerCase().replace(/\s+/g, '_'),
        is_enabled_globally: false,
        allowed_roles: [] 
    }).select().single();

    if (error) alert(error.message);
    else {
        setFlags([data, ...flags]);
        setNewFlagKey('');
        logAction('CREATE_FLAG', data.id, { key: data.key });
    }
  }

  async function deleteFlag(id: string) {
    if (!confirm("Delete this flag definition?")) return;
    await supabase.from('feature_flags').delete().eq('id', id);
    setFlags(flags.filter(f => f.id !== id));
  }

  async function logAction(action: string, target: string, details: any) {
    await supabase.rpc('log_admin_action', { 
        p_action: action, 
        p_resource: 'feature_flags', 
        p_target_id: target, 
        p_details: details 
    });
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Feature Flags & Safety</h1>
                    <p className="text-slate-400">Control platform capabilities instantly.</p>
                </div>
            </div>
        </div>

        {/* EMERGENCY CONTROLS */}
        <Card className="bg-red-950/20 border-red-900/50">
            <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2"><ShieldAlert size={18}/> Emergency Kill Switches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-red-950/30 p-4 rounded border border-red-900/30">
                    <div>
                        <p className="font-bold text-red-200">Kill All Traffic (Maintenance Mode)</p>
                        <p className="text-xs text-red-400">Redirects all users to a maintenance page.</p>
                    </div>
                    <Switch checked={emergency.kill_all_traffic} onCheckedChange={() => toggleEmergency('kill_all_traffic', emergency.kill_all_traffic)} />
                </div>
                <div className="flex items-center justify-between bg-red-950/30 p-4 rounded border border-red-900/30">
                    <div>
                        <p className="font-bold text-red-200">Disable Auth (Login/Signup)</p>
                        <p className="text-xs text-red-400">Prevents new sessions. Existing users stay logged in.</p>
                    </div>
                    <Switch checked={emergency.kill_auth_system} onCheckedChange={() => toggleEmergency('kill_auth_system', emergency.kill_auth_system)} />
                </div>
            </CardContent>
        </Card>

        {/* FEATURE FLAGS */}
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2"><Flag size={18}/> Feature Toggles</CardTitle>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="bg-slate-800 text-slate-200"><Plus size={14} className="mr-1"/> Create Flag</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white">
                        <DialogHeader><DialogTitle>New Feature Flag</DialogTitle></DialogHeader>
                        <div className="py-4 space-y-4">
                            <Input placeholder="flag_key_name (e.g. beta_chat)" className="bg-slate-950 border-slate-800 text-white" value={newFlagKey} onChange={e => setNewFlagKey(e.target.value)} />
                            <Button onClick={createFlag} className="w-full bg-blue-600">Create Toggle</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
                {flags.length === 0 && <p className="text-slate-500 italic p-4 text-center">No active flags.</p>}
                {flags.map(flag => (
                    <div key={flag.id} className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono text-xs border-slate-700 text-blue-400">{flag.key}</Badge>
                            {flag.allowed_roles && flag.allowed_roles.length > 0 && <Badge className="text-[10px] bg-purple-900 text-purple-200">Targeted</Badge>}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`text-xs font-bold uppercase ${flag.is_enabled_globally ? 'text-green-500' : 'text-slate-600'}`}>
                                {flag.is_enabled_globally ? 'Active' : 'Disabled'}
                            </span>
                            <Switch checked={flag.is_enabled_globally} onCheckedChange={() => toggleFlag(flag.id, flag.is_enabled_globally)} />
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-red-500" onClick={() => deleteFlag(flag.id)}>
                                <Trash2 size={14}/>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}