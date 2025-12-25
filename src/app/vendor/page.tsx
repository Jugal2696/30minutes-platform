"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VendorPortal() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('OOH_BILLBOARD');
  const [myAssets, setMyAssets] = useState<any[]>([]);
  
  // New States for Multi-Business Handling
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState("Initializing Dashboard...");

  useEffect(() => {
    checkUserAndBusiness();
  }, []);

  async function checkUserAndBusiness() {
    setDebugMsg("Checking User...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setDebugMsg("User Found. Checking Business...");
    
    // UPDATED QUERY: Use .limit(1) instead of .single() to prevent crashes
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', user.id);

    if (error) {
        setDebugMsg(`❌ DB Error: ${error.message}`);
        return;
    }

    if (businesses && businesses.length > 0) {
        // Success: Pick the first business found
        const myBusiness = businesses[0];
        setBusinessId(myBusiness.id);
        setDebugMsg(`✅ Loaded Business: ${myBusiness.name} (ID: ${myBusiness.id})`);
        fetchMyAssets(myBusiness.id);
    } else {
        // Only redirect if TRULY no business exists
        setDebugMsg("⚠️ No Business Found. Redirecting to Onboarding in 3s...");
        setTimeout(() => window.location.href = '/vendor/onboarding', 3000);
    }
  }

  async function fetchMyAssets(bId: string) {
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('business_id', bId) 
      .order('created_at', { ascending: false });
    if (data) setMyAssets(data);
  }

  async function handleUpload() {
    if (!name || !price || !businessId) return alert("Fill all details");
    setLoading(true);

    const { error } = await supabase.from('assets').insert({
      business_id: businessId, 
      name,
      base_price_per_day: price,
      type,
      status: 'AVAILABLE'
    });

    if (!error) {
      alert('Asset Live!');
      fetchMyAssets(businessId);
      setName(''); setPrice('');
    } else {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  }

  // If loading or debugging, show the status (STOP THE LOOP)
  if (!businessId) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-black text-green-400 p-10 font-mono">
              <h1 className="text-xl font-bold mb-4">SYSTEM DIAGNOSTICS</h1>
              <p>{debugMsg}</p>
              <Button className="mt-8 bg-red-600 hover:bg-red-700" onClick={() => {supabase.auth.signOut(); window.location.href='/login'}}>
                  Force Sign Out
              </Button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#E3F2FD] p-8 font-sans text-[#0F3057]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display='none'}/>
                <h1 className="text-3xl font-extrabold text-[#0F3057] tracking-tight">Vendor Command Center</h1>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }}>
                   Sign Out
                </Button>
                <Button variant="outline" onClick={() => window.location.href='/'} className="border-[#0F3057] text-[#0F3057] font-bold">
                    ← Market
                </Button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* UPLOAD ENGINE */}
          <Card className="border-t-4 border-[#E65100] shadow-xl bg-white">
            <CardHeader><CardTitle className="text-[#0F3057]">List New Asset</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-bold text-[#0F3057] opacity-80">Asset Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kalavad Road Hoarding" className="border-[#E3F2FD] bg-white text-[#0F3057]" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-sm font-bold text-[#0F3057] opacity-80">Daily Price (₹)</label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="border-[#E3F2FD] bg-white text-[#0F3057]" />
                </div>
                <div className="flex-1">
                    <label className="text-sm font-bold text-[#0F3057] opacity-80">Type</label>
                    <select className="w-full p-2 border border-[#E3F2FD] rounded-md bg-white text-[#0F3057]" value={type} onChange={e => setType(e.target.value)}>
                        <option value="OOH_BILLBOARD">Billboard</option>
                        <option value="INFLUENCER">Influencer</option>
                        <option value="GUERRILLA_SPOT">Stunt Spot</option>
                        <option value="DIGITAL_SCREEN">Digital Screen</option>
                    </select>
                </div>
              </div>
              <Button onClick={handleUpload} className="w-full bg-[#E65100] hover:bg-[#cc4800] h-12 text-lg font-bold text-white" disabled={loading}>
                {loading ? "Publishing..." : "GO LIVE 🚀"}
              </Button>
            </CardContent>
          </Card>

          {/* LIVE INVENTORY FEED */}
          <Card className="shadow-lg bg-white border border-[#E3F2FD]">
            <CardHeader><CardTitle className="text-[#0F3057]">Your Live Assets</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 h-80 overflow-y-auto pr-2">
                {myAssets.length === 0 && <p className="text-[#0F3057] opacity-50 text-center mt-10">No assets live yet.</p>}
                {myAssets.map((asset) => (
                  <div key={asset.id} className="flex justify-between items-center p-4 bg-white border border-[#E3F2FD] rounded-lg shadow-sm hover:shadow-md transition-all">
                    <div>
                        <p className="font-bold text-[#0F3057]">{asset.name}</p>
                        <span className="text-xs font-bold text-[#0F3057] bg-[#E3F2FD] px-2 py-1 rounded uppercase">{asset.type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[#E65100] font-bold text-lg">₹{asset.base_price_per_day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}