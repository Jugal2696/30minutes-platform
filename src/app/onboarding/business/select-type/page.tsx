"use client";
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Zap, Users2, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      <div className="max-w-5xl w-full space-y-10">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Define Your Inventory</h1>
          <p className="text-slate-500 text-lg">What kind of value are you bringing to the Omni-Market?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card 
                onClick={() => setSelectedType('OOH')}
                className={`p-8 cursor-pointer border-2 relative hover:shadow-xl transition-all ${selectedType === 'OOH' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'OOH' && <div className="absolute top-4 right-4 text-blue-600"><CheckCircle2 /></div>}
                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <Map size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">OOH & Billboards</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    I own physical ad spaces, digital screens, hoardings, or transit media assets.
                </p>
            </Card>

            <Card 
                onClick={() => setSelectedType('GUERRILLA')}
                className={`p-8 cursor-pointer border-2 relative hover:shadow-xl transition-all ${selectedType === 'GUERRILLA' ? 'border-orange-600 bg-orange-50 ring-1 ring-orange-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'GUERRILLA' && <div className="absolute top-4 right-4 text-orange-600"><CheckCircle2 /></div>}
                <div className="h-14 w-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                    <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Guerrilla Marketing</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    I manage street teams, flyer distribution, pop-up activations, or wild posting.
                </p>
            </Card>

            <Card 
                onClick={() => setSelectedType('CO_BRANDING')}
                className={`p-8 cursor-pointer border-2 relative hover:shadow-xl transition-all ${selectedType === 'CO_BRANDING' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-transparent hover:border-slate-200'}`}
            >
                {selectedType === 'CO_BRANDING' && <div className="absolute top-4 right-4 text-green-600"><CheckCircle2 /></div>}
                <div className="h-14 w-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                    <Users2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Co-Branding / Barter</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    I represent a brand looking to swap audiences, assets, or run joint campaigns.
                </p>
            </Card>

        </div>

        <div className="flex justify-center pt-4">
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
