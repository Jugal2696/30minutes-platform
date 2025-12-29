"use client";
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tv, Smartphone, Film, Star, ArrowRight, CheckCircle2, Video, ChevronLeft } from 'lucide-react';

export default function CreatorTypeSelection() {
  const supabase = createClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: Handle Back / Reset Role
  async function handleBack() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('profiles').update({ role: 'UNASSIGNED' }).eq('id', user.id);
    }
    window.location.href = '/onboarding/role-selection';
  }

  async function handleNext() {
    if (!selectedType) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        await supabase.from('creators').upsert({ 
            profile_id: user.id, 
            creator_type: selectedType, 
            verification_status: 'PENDING_FORM' 
        }, { onConflict: 'profile_id' });
    }

    window.location.href = '/onboarding/creator'; 
  }

  const types = [
    { id: 'INFLUENCER', icon: Smartphone, label: 'Social Influencer', desc: 'Instagram, TikTok, Twitter' },
    { id: 'YOUTUBER', icon: Video, label: 'YouTuber', desc: 'Long-form video content' },
    { id: 'TV_STAR', icon: Tv, label: 'TV Star', desc: 'Television serials & shows' },
    { id: 'MOVIE_STAR', icon: Film, label: 'Movie Star', desc: 'Feature films & cinema' },
    { id: 'OTT_STAR', icon: Star, label: 'OTT Star', desc: 'Netflix, Prime, Web Series' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full space-y-10">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Define Your Stage</h1>
          <p className="text-slate-500 text-lg">Verification requirements differ by category.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {types.map((t) => (
                <Card 
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    className={`p-4 cursor-pointer border-2 relative hover:shadow-lg transition-all flex flex-col items-center text-center h-56 justify-center ${selectedType === t.id ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-transparent hover:border-slate-200'}`}
                >
                    {selectedType === t.id && <div className="absolute top-2 right-2 text-purple-600"><CheckCircle2 size={16} /></div>}
                    <div className={`h-12 w-12 shadow-sm rounded-full flex items-center justify-center mb-4 text-slate-900 ${selectedType === t.id ? 'bg-white' : 'bg-slate-100'}`}>
                        <t.icon size={22} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{t.label}</h3>
                    <p className="text-[10px] text-slate-500 mt-2 leading-tight px-2">{t.desc}</p>
                </Card>
            ))}
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
                {loading ? "Saving Profile..." : "Continue"} <ArrowRight className="ml-2" />
            </Button>
        </div>

      </div>
    </div>
  );
}