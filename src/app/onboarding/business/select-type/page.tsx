"use client";
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Zap, Users2, Newspaper, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function BusinessTypeSelection() {
  const supabase = createClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: Handle Back / Reset Role
  async function handleBack() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Unlock the Role so they can choose again
        await supabase.from('profiles').update({ role: 'UNASSIGNED' }).eq('id', user.id);
    }
    window.location.href = '/onboarding/role-selection';
  }

  async function handleNext() {
    if (!selectedType) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        await supabase.from('businesses').upsert({ 
            profile_id: user.id, 
            business_type: selectedType, 
            verification_status: 'PENDING_FORM' 
        }, { onConflict: 'profile_id' });
    }

    window.location.href = '/onboarding/buisness'; 
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-6xl w-full space-y-10">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Define Your Inventory</h1>
          <p className="text-slate-500 text-lg">Select the primary channel you operate in.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. OOH */}
            <Card 
                onClick={() => setSelectedType('OOH')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'OOH' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'OOH' && <div className="absolute top-3 right-3 text-blue-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Map size={28} /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">OOH & Billboards</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Physical ad spaces, digital screens, hoardings.</p>
            </Card>

            {/* 2. GUERRILLA */}
            <Card 
                onClick={() => setSelectedType('GUERRILLA')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'GUERRILLA' ? 'border-orange-600 bg-orange-50 ring-1 ring-orange-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'GUERRILLA' && <div className="absolute top-3 right-3 text-orange-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Zap size={28} /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Guerrilla Marketing</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Street teams, flyer distribution, pop-up activations.</p>
            </Card>

            {/* 3. PRINT MEDIA */}
            <Card 
                onClick={() => setSelectedType('PRINT_MEDIA')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'PRINT_MEDIA' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'PRINT_MEDIA' && <div className="absolute top-3 right-3 text-indigo-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><Newspaper size={28} /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Print Ads</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Newspapers, magazines, local tabloids.</p>
            </Card>

            {/* 4. CO-BRANDING */}
            <Card 
                onClick={() => setSelectedType('CO_BRANDING')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'CO_BRANDING' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'CO_BRANDING' && <div className="absolute top-3 right-3 text-green-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4"><Users2 size={28} /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Co-Branding</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Brands looking to swap audiences or assets.</p>
            </Card>

        </div>

        {/* ✅ UPDATED FOOTER with BACK Button */}
        <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-4">
            <Button 
                variant="ghost" 
                onClick={handleBack} 
                disabled={loading} 
                className="text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            >
                <ChevronLeft className="mr-2" size={20} /> Change Role
            </Button>

            <Button 
                onClick={handleNext} 
                disabled={!selectedType || loading} 
                className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all"
            >
                {loading ? "Processing..." : "Continue"} <ArrowRight className="ml-2" />
            </Button>
        </div>

      </div>
    </div>
  );
}