"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Clock, ExternalLink, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgreementConsole() {
  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [myBusinessId, setMyBusinessId] = useState<string | null>(null);
  
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [proofData, setProofData] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAgreements();
  }, []);

  async function fetchAgreements() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: me } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (me) {
      setMyBusinessId(me.id);
      
      const { data } = await supabase
        .from('co_branding_agreements')
        .select(`
          *,
          intent:co_branding_intents (
            requested_option:co_branding_options!requested_option_id (title, expected_deliverable, proof_type),
            offered_option:co_branding_options!offered_option_id (title, expected_deliverable, proof_type)
          ),
          brand_a:businesses!brand_a_id (id, business_name),
          brand_b:businesses!brand_b_id (id, business_name),
          proofs:co_branding_proofs (id, business_id, proof_data, submitted_at)
        `)
        .or(`brand_a_id.eq.${me.id},brand_b_id.eq.${me.id}`)
        .order('started_at', { ascending: false });

      if (data) setAgreements(data);
    }
    setLoading(false);
  }

  async function submitProof() {
    if (!myBusinessId || !selectedAgreement || !proofData) return;
    setSubmitting(true);

    const proofType = 'URL'; 

    const { error } = await supabase.from('co_branding_proofs').insert({
        agreement_id: selectedAgreement.id,
        business_id: myBusinessId,
        proof_data: proofData,
        proof_type: proofType,
        admin_verification_status: 'PENDING'
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Proof Submitted! Admin will verify.");
        setProofData('');
        setSelectedAgreement(null);
        fetchAgreements();
    }
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Active Agreements</h1>
                <p className="text-slate-500">Track deadlines and submit proof of execution.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href='/dashboard/brand'}>Back to Dashboard</Button>
        </div>

        {agreements.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-lg">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-900 font-bold">No active contracts.</p>
                <p className="text-sm text-slate-500">Find partners to start collaborating.</p>
                <Button className="mt-4" onClick={() => window.location.href='/brand/cobranding/discover'}>Find Partners</Button>
            </div>
        ) : (
            <div className="space-y-6">
                {agreements.map((deal) => {
                    const isBrandA = deal.brand_a.id === myBusinessId;
                    const partner = isBrandA ? deal.brand_b : deal.brand_a;
                    const myObligation = isBrandA ? deal.intent.offered_option : deal.intent.requested_option;
                    const partnerObligation = isBrandA ? deal.intent.requested_option : deal.intent.offered_option;
                    
                    const myProof = deal.proofs.find((p: any) => p.business_id === myBusinessId);
                    const partnerProof = deal.proofs.find((p: any) => p.business_id !== myBusinessId);

                    return (
                        <Card key={deal.id} className="border-l-4 border-l-blue-600 shadow-md">
                            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">ACTIVE</Badge>
                                            <span className="text-xs text-slate-500 font-mono uppercase">ID: {deal.id.substring(0,8)}</span>
                                        </div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            Partnership with <span className="text-blue-600">{partner.business_name}</span>
                                        </CardTitle>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-900 flex items-center justify-end gap-2">
                                            <Clock size={16} className="text-orange-500"/> 
                                            Due: {new Date(deal.deadline_at).toLocaleDateString()}
                                        </div>
                                        <p className="text-xs text-slate-400">Started: {new Date(deal.started_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <CheckCircle2 size={16}/> Your Responsibility
                                        </h3>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <p className="font-bold text-slate-900 text-lg mb-1">{myObligation.title}</p>
                                            <p className="text-sm text-slate-600 mb-2">{myObligation.expected_deliverable}</p>
                                            <Badge variant="outline" className="text-xs bg-white">{myObligation.proof_type} Required</Badge>
                                        </div>
                                        
                                        {myProof ? (
                                            <div className="bg-green-50 p-3 rounded border border-green-200 text-green-800 text-sm flex items-center gap-2">
                                                <CheckCircle2 size={16}/> Proof Submitted on {new Date(myProof.submitted_at).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <Dialog onOpenChange={(open: boolean) => !open && setSelectedAgreement(null)}>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full bg-slate-900 text-white" onClick={() => setSelectedAgreement(deal)}>
                                                        <UploadCloud size={16} className="mr-2"/> Submit Proof
                                                    </Button>
                                                </DialogTrigger>
                                                {selectedAgreement?.id === deal.id && (
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Submit Proof of Execution</DialogTitle>
                                                            <DialogDescription>
                                                                Provide a live URL or link to the completed work.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-bold text-slate-700">Proof URL / Location</label>
                                                                <Input 
                                                                    placeholder="https://instagram.com/p/..." 
                                                                    value={proofData}
                                                                    onChange={e => setProofData(e.target.value)}
                                                                />
                                                                <p className="text-xs text-slate-500">
                                                                    Admins will verify this link matches the deliverable "{myObligation.expected_deliverable}".
                                                                </p>
                                                            </div>
                                                            <Button 
                                                                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                                                                onClick={submitProof}
                                                                disabled={submitting || !proofData}
                                                            >
                                                                {submitting ? "Uploading..." : "Submit for Verification"}
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <ExternalLink size={16}/> Partner Responsibility
                                        </h3>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 opacity-75">
                                            <p className="font-bold text-slate-900 text-lg mb-1">{partnerObligation.title}</p>
                                            <p className="text-sm text-slate-600 mb-2">{partnerObligation.expected_deliverable}</p>
                                            <Badge variant="outline" className="text-xs bg-white">{partnerObligation.proof_type} Required</Badge>
                                        </div>

                                        {partnerProof ? (
                                            <div className="bg-green-50 p-3 rounded border border-green-200 text-green-800 text-sm flex items-center gap-2">
                                                <CheckCircle2 size={16}/> Partner submitted proof.
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                                                <Clock size={16}/> Waiting for partner...
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}