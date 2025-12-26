"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Scale, History } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LegalEngine() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    const { data } = await supabase.from('legal_documents').select('*').order('created_at', { ascending: false });
    if (data) setDocuments(data);
    setLoading(false);
  }

  async function createNewVersion(type: string) {
    const content = prompt(`Enter content for ${type} (Markdown/HTML):`);
    if (!content) return;
    const version = prompt("Enter Version Number (e.g., 2.0):", "1.0");

    // Deactivate old
    await supabase.from('legal_documents').update({ is_active: false }).eq('type', type);

    // Insert new
    await supabase.from('legal_documents').insert({
        type,
        version,
        content,
        is_active: true
    });

    // Audit
    await supabase.rpc('log_admin_action', { 
        p_action: 'UPDATE_LEGAL', 
        p_resource: 'legal_documents', 
        p_target_id: type, 
        p_details: { version } 
    });

    fetchDocs();
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
                    <h1 className="text-3xl font-bold">Legal Engine</h1>
                    <p className="text-slate-400">Manage compliance documents & versioning.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['TERMS', 'PRIVACY', 'REFUND', 'GUIDELINES'].map(type => {
                const activeDoc = documents.find(d => d.type === type && d.is_active);
                return (
                    <Card key={type} className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="text-white flex items-center gap-2"><Scale size={18}/> {type}</CardTitle>
                            {activeDoc && <Badge className="bg-green-900 text-green-300">v{activeDoc.version}</Badge>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-24 bg-slate-950 rounded border border-slate-800 p-3 text-xs text-slate-500 overflow-hidden">
                                {activeDoc ? activeDoc.content.substring(0, 150) + '...' : 'No active document.'}
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1 bg-slate-800 hover:bg-slate-700" onClick={() => createNewVersion(type)}>
                                    Update Policy
                                </Button>
                                <Button variant="ghost" size="icon" title="View History">
                                    <History size={16}/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    </div>
  );
}