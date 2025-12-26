"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Briefcase, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VerificationConsole() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    
    // Fetch Pending Brands
    const { data: bData } = await supabase
        .from('businesses')
        .select('*')
        .eq('verification_status', 'PENDING')
        .order('created_at', { ascending: false });
    if (bData) setBrands(bData);

    // Fetch Pending Creators
    const { data: cData } = await supabase
        .from('creators')
        .select('*')
        .eq('verification_status', 'PENDING')
        .order('created_at', { ascending: false });
    if (cData) setCreators(cData);

    setLoading(false);
  }

  async function handleDecision(table: 'businesses' | 'creators', id: string, status: 'APPROVED' | 'REJECTED') {
    const { error } = await supabase.from(table).update({ verification_status: status }).eq('id', id);
    
    if (error) {
        alert("Error: " + error.message);
    } else {
        // Audit
        await supabase.rpc('log_admin_action', { 
            p_action: `VERIFY_${status}`, 
            p_resource: table, 
            p_target_id: id, 
            p_details: {} 
        });
        fetchPending(); // Refresh UI
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
        </div>

        <Tabs defaultValue="brands" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
                <TabsTrigger value="creators">Creators ({creators.length})</TabsTrigger>
            </TabsList>

            {/* BRANDS LIST */}
            <TabsContent value="brands" className="space-y-4">
                {brands.length === 0 && <p className="text-slate-500 italic p-4 text-center">No pending brand verifications.</p>}
                {brands.map(brand => (
                    <Card key={brand.id} className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400">
                                    <Briefcase size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{brand.business_name}</h3>
                                    <p className="text-sm text-slate-500">{brand.industry} • {brand.location}</p>
                                    <p className="text-xs text-slate-600 mt-1 font-mono">{brand.website_url}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => handleDecision('businesses', brand.id, 'REJECTED')}>
                                    <XCircle size={16} className="mr-2"/> Reject
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleDecision('businesses', brand.id, 'APPROVED')}>
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
                                    <p className="text-sm text-slate-500">{creator.niche} • {creator.followers_count} Followers</p>
                                    <p className="text-xs text-slate-600 mt-1 font-mono">{creator.platform}</p>
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