"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Loader2, FileText, ExternalLink } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    // Check role in profiles
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'ADMIN') {
        // If not admin, kick them out
        window.location.href = '/dashboard/brand';
    }
  }

  async function fetchData() {
    setLoading(true);
    // 1. Fetch Brands
    const { data: bData } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (bData) setBrands(bData);

    // 2. Fetch Creators
    const { data: cData } = await supabase.from('creators').select('*').order('created_at', { ascending: false });
    if (cData) setCreators(cData);

    // 3. Fetch Pending Proofs
    const { data: pData } = await supabase
        .from('co_branding_proofs')
        .select(`
            *,
            business:businesses(business_name),
            agreement:co_branding_agreements(
                id,
                intent:co_branding_intents(
                    requested_option:co_branding_options!requested_option_id(title),
                    offered_option:co_branding_options!offered_option_id(title)
                )
            )
        `)
        .eq('admin_verification_status', 'PENDING');
    if (pData) setProofs(pData);
    
    setLoading(false);
  }

  // USER APPROVAL
  async function updateStatus(table: 'businesses' | 'creators', id: string, status: 'APPROVED' | 'REJECTED') {
    await supabase.from(table).update({ verification_status: status }).eq('id', id);
    fetchData(); 
  }

  // PROOF VERIFICATION
  async function verifyProof(proofId: string, agreementId: string, status: 'APPROVED' | 'REJECTED') {
    if (status === 'APPROVED') {
        // 1. Mark Proof as Approved
        await supabase.from('co_branding_proofs').update({ admin_verification_status: 'APPROVED' }).eq('id', proofId);
        // 2. Mark Agreement Completed (Simplified)
        await supabase.from('co_branding_agreements').update({ status: 'COMPLETED' }).eq('id', agreementId);
    } else {
        await supabase.from('co_branding_proofs').update({ admin_verification_status: 'REJECTED' }).eq('id', proofId);
    }
    fetchData();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">System Command</h1>
                <p className="text-slate-400">Master Control // Governance</p>
            </div>
            <Button variant="destructive" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>
                Secure Logout
            </Button>
        </div>

        <Tabs defaultValue="brands" className="space-y-6">
            <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="brands">Brands ({brands.filter(b => b.verification_status === 'PENDING').length})</TabsTrigger>
                <TabsTrigger value="creators">Creators ({creators.filter(c => c.verification_status === 'PENDING').length})</TabsTrigger>
                <TabsTrigger value="proofs">
                    Proofs ({proofs.length}) 
                    {proofs.length > 0 && <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
                </TabsTrigger>
            </TabsList>

            {/* BRANDS TAB */}
            <TabsContent value="brands" className="space-y-4">
                {brands.map((brand) => (
                    <Card key={brand.id} className="bg-slate-800 border-slate-700 text-slate-100">
                        <CardHeader className="flex flex-row justify-between items-start">
                            <CardTitle className="text-xl">{brand.business_name} <StatusBadge status={brand.verification_status}/></CardTitle>
                            <div className="flex gap-2">
                                {brand.verification_status === 'PENDING' && (
                                    <>
                                        <Button size="sm" className="bg-green-600" onClick={() => updateStatus('businesses', brand.id, 'APPROVED')}>Approve</Button>
                                        <Button size="sm" variant="destructive" onClick={() => updateStatus('businesses', brand.id, 'REJECTED')}>Reject</Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </TabsContent>

            {/* CREATORS TAB */}
            <TabsContent value="creators" className="space-y-4">
                {creators.map((creator) => (
                    <Card key={creator.id} className="bg-slate-800 border-slate-700 text-slate-100">
                        <CardHeader className="flex flex-row justify-between items-start">
                            <CardTitle className="text-xl">{creator.channel_name} <StatusBadge status={creator.verification_status}/></CardTitle>
                            <div className="flex gap-2">
                                {creator.verification_status === 'PENDING' && (
                                    <>
                                        <Button size="sm" className="bg-green-600" onClick={() => updateStatus('creators', creator.id, 'APPROVED')}>Approve</Button>
                                        <Button size="sm" variant="destructive" onClick={() => updateStatus('creators', creator.id, 'REJECTED')}>Reject</Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </TabsContent>

            {/* PROOFS TAB */}
            <TabsContent value="proofs" className="space-y-4">
                {proofs.length === 0 && <p className="text-slate-500 italic">No pending proofs to verify.</p>}
                {proofs.map((proof) => (
                    <Card key={proof.id} className="bg-slate-800 border-slate-700 text-slate-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText size={20} className="text-blue-400"/>
                                Proof from {proof.business.business_name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-slate-900 p-4 rounded border border-slate-700 font-mono text-sm break-all flex items-center justify-between">
                                {proof.proof_data}
                                <a href={proof.proof_data} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                                    <ExternalLink size={16}/>
                                </a>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => verifyProof(proof.id, proof.agreement_id, 'APPROVED')}>
                                    <CheckCircle2 size={16} className="mr-2"/> Verify & Complete Agreement
                                </Button>
                                <Button variant="destructive" onClick={() => verifyProof(proof.id, proof.agreement_id, 'REJECTED')}>
                                    <XCircle size={16} className="mr-2"/> Reject as Fake
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

function StatusBadge({ status }: { status: string }) {
    const colors: any = { APPROVED: 'text-green-400', PENDING: 'text-yellow-400', REJECTED: 'text-red-400' };
    return <span className={`text-xs ml-2 ${colors[status] || 'text-slate-400'}`}>[{status}]</span>;
}