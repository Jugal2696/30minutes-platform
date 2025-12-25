"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProposalInbox() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  useEffect(() => {
    fetchInbox();
  }, []);

  async function fetchInbox() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: me } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (me) {
      // Fetch Incoming Proposals (PENDING)
      // We join requester business details + option details
      const { data } = await supabase
        .from('co_branding_intents')
        .select(`
          *,
          requester:businesses!requester_business_id (business_name, legal_entity_name),
          requested_option:co_branding_options!requested_option_id (title, execution_window_days),
          offered_option:co_branding_options!offered_option_id (title, execution_window_days)
        `)
        .eq('receiver_business_id', me.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (data) setProposals(data);
    }
    setLoading(false);
  }

  async function handleDecision(decision: 'ACCEPTED' | 'REJECTED') {
    if (!selectedProposal) return;
    setProcessingId(selectedProposal.id);

    // 1. Update Status
    const { error } = await supabase
        .from('co_branding_intents')
        .update({ status: decision })
        .eq('id', selectedProposal.id);

    if (error) {
        alert("Error: " + error.message);
    } else {
        // 2. UI Refresh
        setProposals(proposals.filter(p => p.id !== selectedProposal.id));
        setSelectedProposal(null);
        if (decision === 'ACCEPTED') {
            // Optional: Redirect to agreements or show success
            alert("Proposal Accepted! Agreement Created.");
        }
    }
    setProcessingId(null);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Proposal Inbox</h1>
                <p className="text-slate-500">Review and accept collaboration requests.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href='/dashboard/brand'}>Back to Dashboard</Button>
        </div>

        {/* INBOX LIST */}
        {proposals.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-lg">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <MessageSquare size={24} />
                </div>
                <p className="text-slate-900 font-bold">All caught up!</p>
                <p className="text-sm text-slate-500">You have no pending proposals.</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {proposals.map((prop) => (
                    <Card key={prop.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedProposal(prop)}>
                        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                                    {prop.requester.business_name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-slate-900">{prop.requester.business_name}</h3>
                                        <Badge variant="secondary" className="text-xs">Pending Review</Badge>
                                    </div>
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span className="font-medium text-slate-700">They Want:</span> {prop.requested_option.title}
                                        <ArrowRight size={14} className="text-slate-400"/>
                                        <span className="font-medium text-slate-700">They Offer:</span> {prop.offered_option.title}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(prop.created_at).toLocaleDateString()}</span>
                                <Button size="sm" className="bg-slate-900 text-white group-hover:bg-blue-600 transition-colors">Review</Button>
                            </div>

                        </CardContent>
                    </Card>
                ))}
            </div>
        )}

        {/* REVIEW DIALOG */}
        <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
            {selectedProposal && (
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Review Proposal</DialogTitle>
                        <DialogDescription>From {selectedProposal.requester.business_name}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* THE DEAL */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">They Get (Your Service)</p>
                                <p className="font-bold text-slate-900">{selectedProposal.requested_option.title}</p>
                                <p className="text-xs text-slate-500">{selectedProposal.requested_option.execution_window_days} Days to execute</p>
                            </div>
                            <div className="border-l border-slate-200 pl-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">You Get (Their Service)</p>
                                <p className="font-bold text-slate-900">{selectedProposal.offered_option.title}</p>
                                <p className="text-xs text-slate-500">{selectedProposal.offered_option.execution_window_days} Days to execute</p>
                            </div>
                        </div>

                        {/* PRIVATE NOTE */}
                        {selectedProposal.private_note && (
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <MessageSquare size={16}/> Private Note
                                </p>
                                <p className="text-sm text-slate-600 italic bg-yellow-50 p-3 rounded border border-yellow-100">
                                    "{selectedProposal.private_note}"
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleDecision('REJECTED')}
                            disabled={!!processingId}
                        >
                            <XCircle size={16} className="mr-2"/> Reject
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleDecision('ACCEPTED')}
                            disabled={!!processingId}
                        >
                            {processingId ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 size={16} className="mr-2"/>}
                            Accept & Start Contract
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>

      </div>
    </div>
  );
}