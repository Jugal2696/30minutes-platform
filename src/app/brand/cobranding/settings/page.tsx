"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; // Ensure you have this or use a simple checkbox
import { Loader2, Plus, Trash2, ShieldCheck, Briefcase } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CoBrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  
  // New Option Form State
  const [newOption, setNewOption] = useState({
    title: '',
    expected_deliverable: '',
    execution_window_days: 7,
    proof_type: 'URL'
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Business Status
    const { data: bus } = await supabase
      .from('businesses')
      .select('id, co_branding_enabled')
      .eq('profile_id', user.id)
      .single();

    if (bus) {
      setBusinessId(bus.id);
      setIsEnabled(bus.co_branding_enabled);
      
      // 2. Get Options
      const { data: opts } = await supabase
        .from('co_branding_options')
        .select('*')
        .eq('business_id', bus.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (opts) setOptions(opts);
    }
    setLoading(false);
  }

  async function toggleStatus() {
    if (!businessId) return;
    const newState = !isEnabled;
    setIsEnabled(newState); // Optimistic update
    
    await supabase
      .from('businesses')
      .update({ co_branding_enabled: newState })
      .eq('id', businessId);
  }

  async function addOption() {
    if (!businessId || !newOption.title || !newOption.expected_deliverable) return;
    
    const { data, error } = await supabase.from('co_branding_options').insert({
        business_id: businessId,
        title: newOption.title,
        expected_deliverable: newOption.expected_deliverable,
        execution_window_days: newOption.execution_window_days,
        proof_type: newOption.proof_type,
        is_active: true
    }).select();

    if (data) {
        setOptions([data[0], ...options]);
        setNewOption({ title: '', expected_deliverable: '', execution_window_days: 7, proof_type: 'URL' }); // Reset
    }
  }

  async function deleteOption(id: string) {
    // Soft delete
    await supabase.from('co_branding_options').update({ is_active: false }).eq('id', id);
    setOptions(options.filter(o => o.id !== id));
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Co-Branding Config</h1>
                <p className="text-slate-500">Manage your collaboration availability and menu.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href='/dashboard/brand'}>Back to Dashboard</Button>
        </div>

        {/* 1. GLOBAL TOGGLE */}
        <Card className={isEnabled ? "border-green-200 bg-green-50" : "border-slate-200"}>
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isEnabled ? 'bg-green-200 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Co-Branding Status: {isEnabled ? 'ACTIVE' : 'DISABLED'}</h3>
                        <p className="text-sm text-slate-600">
                            {isEnabled 
                                ? "You are visible to other brands. They can send you proposals." 
                                : "You are hidden. Enable this to start collaborating."}
                        </p>
                    </div>
                </div>
                {/* Note: If you don't have the Switch component installed, use a Button */}
                <Button 
                    onClick={toggleStatus} 
                    variant={isEnabled ? "default" : "outline"}
                    className={isEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                >
                    {isEnabled ? "Enabled" : "Enable Now"}
                </Button>
            </CardContent>
        </Card>

        {/* 2. OPTION BUILDER */}
        {isEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FORM */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="bg-slate-900 text-white rounded-t-lg">
                        <CardTitle className="text-lg flex items-center gap-2"><Plus size={16}/> Add Service</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                            <Input 
                                value={newOption.title} 
                                onChange={e => setNewOption({...newOption, title: e.target.value})} 
                                placeholder="e.g. Logo Swap" 
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Deliverable</label>
                            <Input 
                                value={newOption.expected_deliverable} 
                                onChange={e => setNewOption({...newOption, expected_deliverable: e.target.value})} 
                                placeholder="e.g. Logo on footer" 
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Days to Execute</label>
                            <Input 
                                type="number"
                                value={newOption.execution_window_days} 
                                onChange={e => setNewOption({...newOption, execution_window_days: parseInt(e.target.value)})} 
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Proof Type</label>
                            <select 
                                className="w-full mt-1 p-2 border rounded text-sm bg-white"
                                value={newOption.proof_type}
                                onChange={e => setNewOption({...newOption, proof_type: e.target.value})}
                            >
                                <option value="URL">Live URL</option>
                                <option value="SCREENSHOT">Screenshot</option>
                                <option value="DOCUMENT">Document</option>
                            </select>
                        </div>
                        <Button onClick={addOption} className="w-full bg-slate-900 text-white">Add Option</Button>
                    </CardContent>
                </Card>

                {/* LIST */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase size={20} /> Your Menu ({options.length})
                    </h3>
                    {options.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-300 rounded-lg text-center text-slate-400">
                            Add options to let brands know how you can collaborate.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <Card key={opt.id} className="group hover:shadow-md transition-all">
                                <CardContent className="p-4 flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{opt.title}</h4>
                                        <p className="text-sm text-slate-600">{opt.expected_deliverable}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{opt.execution_window_days} Days</span>
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{opt.proof_type}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => deleteOption(opt.id)} className="text-red-300 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}