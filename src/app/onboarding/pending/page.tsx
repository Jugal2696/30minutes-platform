"use client";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ShieldCheck } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PendingVerification() {
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
          <CardTitle className="text-slate-900 text-2xl font-bold">Verification In Progress</CardTitle>
          <p className="text-slate-500">Application Reference: #PENDING</p>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          
          <div className="bg-yellow-50 p-4 rounded-lg text-left text-sm text-yellow-800 border border-yellow-200">
            <p className="font-bold flex items-center gap-2 mb-2">
              <ShieldCheck size={16} /> Trust & Safety Protocol
            </p>
            <p>
              To maintain the integrity of our marketplace, all business profiles undergo a strict manual review. 
              This process typically takes 24-48 hours.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-slate-600 text-sm">
              We will notify you via email once your access is approved.
              You cannot access the dashboard until then.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <Button variant="outline" onClick={handleSignOut} className="w-full">
                Sign Out
             </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}