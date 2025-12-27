"use client";
// ✅ CTO FIX: Switched to internal Cookie Client to prevent /login redirect loops
import { createClient } from '@/lib/supabase/client'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ShieldCheck } from 'lucide-react';

export default function PendingVerification() {
  // ✅ Use our standardized client that handles SSR Cookies
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-yellow-500">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
               <Clock size={32} />
            </div>
          </div>
          <CardTitle className="text-slate-900 text-2xl font-bold tracking-tight">Verification In Progress</CardTitle>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Application Status: #PENDING</p>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          
          <div className="bg-yellow-50 p-4 rounded-lg text-left text-sm text-yellow-800 border border-yellow-200">
            <p className="font-bold flex items-center gap-2 mb-2 uppercase text-[10px] tracking-widest">
              <ShieldCheck size={16} /> Trust & Safety Protocol
            </p>
            <p className="leading-relaxed">
              To maintain the integrity of 30Minutes Market, all business profiles undergo manual review. 
              Our team will verify your entity within 24-48 hours.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-slate-600 text-sm italic">
              You will receive an email confirmation once your Mission Control access is granted.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
             <Button variant="outline" onClick={handleSignOut} className="w-full font-bold border-slate-300">
                Sign Out
             </Button>
             <button onClick={() => window.location.href = '/'} className="text-[10px] text-slate-400 hover:text-slate-900 uppercase font-bold transition-colors">
                Return to Homepage
             </button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}