"use client";
import { useEffect, useState } from 'react';
// ✅ UPDATE: Using internal Cookie Client to prevent auth loops
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Briefcase, User, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner"; // Assuming you have sonner or similar for toasts

export default function VerificationConsole() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    init();
    
    // 🔔 REAL-TIME LISTENER: Listen for new INSERTs to alert Admin immediately
    const channel = supabase
      .channel('admin-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'businesses' }, (payload) => {
         newSubmissionAlert('Business', payload.new.business_name);
         fetchPending(); // Auto-refresh list
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'creators' }, (payload) => {
         newSubmissionAlert('Creator', payload.new.channel_name);
         fetchPending(); // Auto-refresh list
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function init() {
    // 1. ✅ UPDATE: GOD-MODE RBAC Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
        window.location.href = '/admin';
        return;
    }

    // Request Notification Permission on Load
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    fetchPending();
  }

  function newSubmissionAlert(type: string, name: string) {
      // 1. In-App Toast
      // toast.info(`New ${type} Pending: ${name}`); 
      
      // 2. System Notification (PC/Phone)
      if (Notification.permission === "granted") {
          new Notification("30Minutes Admin Alert", {
              body: `New ${type} Verification Pending: ${name}`,
              icon: "/logo.png" // Ensure this path exists
          });
      }
      
      // 3. Play Sound (Optional Ping)
      const audio = new Audio('/notification.mp3'); // Add a sound file to public folder if desired
      audio.play().catch(e => console.log("Audio blocked"));
  }

  async function fetchPending() {
    setLoading(true);
    
    try {
        // Fetch Pending Businesses
        // ✅ CTO FIX: Updated select to match actual schema fields
        const { data: bData, error: bError } = await supabase
            .from('businesses')
            .select('*')
            .eq('verification_status', 'PENDING')
            .order('created_at', { ascending: false });
        
        if (bError) console.error("Biz Fetch Error:", bError);
        if (bData) setBusinesses(bData);

        // Fetch Pending Creators
        // ✅ CTO FIX: Updated select to match actual schema fields
        const { data: cData, error: cError } = await supabase
            .from('creators')
            .select('*')
            .eq('verification_status', 'PENDING')
            .order('created_at', { ascending: false });

        if (cError) console.error("Creator Fetch Error:", cError);
        if (cData) setCreators(cData);

    } catch (e) {
        console.error("Fetch pending failed:", e);
    }

    setLoading(false);
  }

  async function handleDecision(table: 'businesses' | 'creators', id: string, status: 'APPROVED' | 'REJECTED') {
    const { error } = await supabase.from(table).update({ verification_status: status }).eq('id', id);
    
    if (error) {
        alert("Error: " + error.message);
    } else {
        // Audit Log using RPC (Silent fail if RPC doesn't exist yet to prevent crash)
        try {
            await supabase.rpc('log_admin_action', { 
                p_action: `VERIFY_${status}`, 
                p_resource: table, 
                p_target_id: id, 
                p_details: {} 
            });
        } catch (e) { console.log("Audit log skipped"); }
        
        // 📧 MOCK EMAIL NOTIFICATION TO USER (In production, trigger Edge Function here)
        console.log(`Sending ${status} email to user...`);

        fetchPending(); 
    }
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
                    <h1 className="text-3xl font-bold">Verification Console</h1>
                    <p className="text-slate-400">Review and approve new partners.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" onClick={() => fetchPending()}>
                    Refresh Queue
                 </Button>
                 <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20 flex items-center gap-2">
                    <Bell size={12} /> Live Mode Active
                 </div>
            </div>
        </div>

        <Tabs defaultValue="businesses" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="businesses">Businesses ({businesses.length})</TabsTrigger>
                <TabsTrigger value="creators">Creators ({creators.length})</TabsTrigger>
            </TabsList>

            {/* BUSINESS LIST */}
            <TabsContent value="businesses" className="space-y-4">
                {businesses.length === 0 && <p className="text-slate-500 italic p-4 text-center">No pending business verifications.</p>}
                {businesses.map(biz => (
                    <Card key={biz.id} className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400">
                                    <Briefcase size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{biz.business_name}</h3>
                                    {/* ✅ CTO FIX: Use actual DB columns or fallbacks */}
                                    <p className="text-sm text-slate-500">
                                        {(biz.categories && biz.categories[0]) || 'General'} • {(biz.operating_regions && biz.operating_regions[0]) || 'Global'}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1 font-mono">{biz.website_url || biz.business_email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => handleDecision('businesses', biz.id, 'REJECTED')}>
                                    <XCircle size={16} className="mr-2"/> Reject
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleDecision('businesses', biz.id, 'APPROVED')}>
                                    <CheckCircle2 size={16} className="mr-2"/> Approve
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </TabsContent>

            {/* CREATORS LIST */}
            <TabsContent value="creators" className="space-y-4">
                {creators.length === 0 && <p className="text-slate-500 italic p-4 text-center">No pending creator verifications.</p>}
                {creators.map(creator => (
                    <Card key={creator.id} className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-400">
                                    <User size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{creator.channel_name}</h3>
                                    {/* ✅ CTO FIX: Use actual DB columns or fallbacks */}
                                    <p className="text-sm text-slate-500">
                                        {creator.primary_niche || 'Creator'} • {creator.total_followers ? creator.total_followers.toLocaleString() : '0'} Followers
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1 font-mono">{creator.bio?.substring(0, 40)}...</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => handleDecision('creators', creator.id, 'REJECTED')}>
                                    <XCircle size={16} className="mr-2"/> Reject
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleDecision('creators', creator.id, 'APPROVED')}>
                                    <CheckCircle2 size={16} className="mr-2"/> Approve
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}