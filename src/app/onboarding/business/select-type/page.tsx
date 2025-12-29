"use client";
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Zap, Users2, Newspaper, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BusinessTypeSelection() {
  const supabase = createClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

        {/* ✅ RESTORED: 4 items in a row (lg:grid-cols-4) matching previous card style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. OOH */}
            <Card 
                onClick={() => setSelectedType('OOH')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'OOH' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'OOH' && <div className="absolute top-3 right-3 text-blue-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Map size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">OOH & Billboards</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                    Physical ad spaces, digital screens, hoardings, and transit media assets.
                </p>
            </Card>

            {/* 2. GUERRILLA */}
            <Card 
                onClick={() => setSelectedType('GUERRILLA')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'GUERRILLA' ? 'border-orange-600 bg-orange-50 ring-1 ring-orange-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'GUERRILLA' && <div className="absolute top-3 right-3 text-orange-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                    <Zap size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Guerrilla Marketing</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                    Street teams, flyer distribution, pop-up activations, and wild posting.
                </p>
            </Card>

            {/* 3. PRINT MEDIA (NEW) */}
            <Card 
                onClick={() => setSelectedType('PRINT_MEDIA')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'PRINT_MEDIA' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'PRINT_MEDIA' && <div className="absolute top-3 right-3 text-indigo-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Newspaper size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Print Ads</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                    Newspapers, magazines, local tabloids, and physical publications.
                </p>
            </Card>

            {/* 4. CO-BRANDING */}
            <Card 
                onClick={() => setSelectedType('CO_BRANDING')}
                className={`p-6 cursor-pointer border-2 hover:shadow-xl transition-all flex flex-col items-center text-center relative ${selectedType === 'CO_BRANDING' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'CO_BRANDING' && <div className="absolute top-3 right-3 text-green-600"><CheckCircle2 size={20} /></div>}
                <div className="h-14 w-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                    <Users2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Co-Branding</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                    Brands looking to swap audiences, assets, or run joint campaigns.
                </p>
            </Card>

        </div>

        <div className="flex justify-center pt-8">
            <Button 
                onClick={handleNext} 
                disabled={!selectedType || loading} 
                className="h-16 px-12 text-lg bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all"
            >
                {loading ? "Saving Profile..." : "Continue to Verification"} <ArrowRight className="ml-2" />
            </Button>
        </div>

      </div>
    </div>
  );
}