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

export default function Onboarding() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('SERVICES');
  const [user, setUser] = useState<any>(null);
  const [debugLog, setDebugLog] = useState<string>('Initializing...');

  useEffect(() => {
    runDiagnostics();
  }, []);

  async function runDiagnostics() {
    // 1. Check User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setDebugLog("❌ No User Logged In. Redirecting to login...");
        setTimeout(() => window.location.href = '/login', 2000);
        return;
    }
    setUser(user);
    setDebugLog(`✅ User Found: ${user.email} (ID: ${user.id})`);

    // 2. Check Business
    setDebugLog(prev => prev + "\n🔍 Checking Database for Business...");
    const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id);

    if (error) {
        setDebugLog(prev => prev + `\n❌ DB ERROR: ${error.message} (Hint: RLS might be on)`);
    } else if (businesses && businesses.length > 0) {
        setDebugLog(prev => prev + `\n✅ Business Found! ID: ${businesses[0].id}. Redirecting...`);
        setTimeout(() => window.location.href = '/vendor', 1000);
    } else {
        setDebugLog(prev => prev + "\n⚠️ No Business Found. Please fill the form below.");
    }
  }

  async function handleCreateBusiness() {
    if (!name || !city) return alert("Please fill all details");

    // Create Profile
    await supabase.from('profiles').upsert({ id: user.id, email: user.email, role: 'VENDOR' });

    // Create Business
    const { data, error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name,
      city,
      category,
      is_verified: true 
    }).select(); // Select to confirm insert

    if (error) {
        alert("CRITICAL ERROR: " + error.message);
        setDebugLog(prev => prev + `\n❌ INSERT FAILED: ${error.message}`);
    } else {
        alert("SUCCESS! Business Created.");
        window.location.href = '/vendor'; 
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-[#E3F2FD] flex flex-col items-center justify-center p-4">
      
      {/* DEBUG CONSOLE (Visualizing the Invisible) */}
      <div className="w-full max-w-lg bg-black text-green-400 p-4 rounded mb-6 font-mono text-xs whitespace-pre-wrap">
        {debugLog}
      </div>

      <Card className="w-full max-w-lg border-t-4 border-[#0F3057] shadow-xl">
        <CardHeader className="relative">
            <Button variant="ghost" className="absolute top-0 right-0 text-red-500" onClick={handleSignOut}>
                Sign Out
            </Button>
          <CardTitle className="text-[#0F3057] text-2xl">Setup Your Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#0F3057]">Business Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-bold text-[#0F3057]">City</label>
            <Input value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
             <label className="text-sm font-bold text-[#0F3057]">Category</label>
             <select className="w-full p-2 border rounded-md" value={category} onChange={e => setCategory(e.target.value)}>
                 <option value="SERVICES">Ad Agency / Services</option>
                 <option value="RETAIL">Retail Owner</option>
             </select>
          </div>
          <Button onClick={handleCreateBusiness} className="w-full bg-[#0F3057] text-white font-bold h-12">
            Force Create Business 🚀
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}