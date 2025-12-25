"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserSquare2, BarChart3, MapPin, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Instagram, Youtube, Linkedin, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreatorOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Social Connection States
  const [connected, setConnected] = useState({
    instagram: false,
    youtube: false,
    linkedin: false
  });

  const [formData, setFormData] = useState({
    channel_name: '',
    primary_niche: '',
    bio: '',
    // Data will be auto-populated
    total_followers: 0,
    engagement_ratio: 0,
    average_reach: 0,
    penetrated_regions: ''
  });

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      setUser(data.user);

      // Pre-check
      const { data: existing } = await supabase
        .from('creators')
        .select('id')
        .eq('profile_id', data.user.id)
        .single();
      
      if (existing) {
        window.location.href = '/onboarding/pending';
      }
    }
    init();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // MOCK EXTRACTION ENGINE (Simulates API Fetch)
  const handleConnect = (platform: 'instagram' | 'youtube' | 'linkedin') => {
    // In System 3, this will trigger real OAuth
    setConnected(prev => ({ ...prev, [platform]: true }));
    
    // Simulate finding data
    if (platform === 'instagram') {
        setFormData(prev => ({
            ...prev,
            total_followers: prev.total_followers + 54000,
            engagement_ratio: 4.2,
            average_reach: prev.average_reach + 12000,
            channel_name: prev.channel_name || "@verified_creator"
        }));
    } else if (platform === 'youtube') {
        setFormData(prev => ({
            ...prev,
            total_followers: prev.total_followers + 125000,
            average_reach: prev.average_reach + 85000
        }));
    }
  };

  async function handleSubmit() {
    if (!user) return;
    if (!isAuthorized) return alert("Authorization required.");
    
    setLoading(true);

    const payload = {
        profile_id: user.id,
        channel_name: formData.channel_name,
        primary_niche: formData.primary_niche,
        bio: formData.bio,
        total_followers: formData.total_followers,
        engagement_ratio: formData.engagement_ratio,
        average_reach: formData.average_reach,
        penetrated_regions: formData.penetrated_regions.split(',').map(s => s.trim()).filter(Boolean),
        verification_status: 'PENDING'
    };

    const { error } = await supabase.from('creators').insert(payload);

    if (error) {
        alert("Submission Error: " + error.message);
        setLoading(false);
    } else {
        window.location.href = '/onboarding/pending';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-6 font-sans">
      <Card className="w-full max-w-3xl shadow-lg border-0 h-fit">
        
        {/* PROGRESS HEADER */}
        <CardHeader className="border-b border-slate-100 bg-white rounded-t-xl pb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Creator Onboarding</span>
                <span className="text-xs font-bold text-slate-900 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Step {step} of 4</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <UserSquare2 className="text-purple-500"/> Channel Identity
                        </h2>
                        <p className="text-slate-500 text-sm">Tell us who you are.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-slate-700">Display Name</label>
                            <Input name="channel_name" value={formData.channel_name} onChange={handleChange} placeholder="@username" className="mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Primary Niche</label>
                            <select name="primary_niche" value={formData.primary_niche} onChange={handleChange} className="w-full p-2 border rounded-md mt-1 bg-white">
                                <option value="">Select Niche...</option>
                                <option value="TECH">Technology & Gadgets</option>
                                <option value="LIFESTYLE">Lifestyle & Fashion</option>
                                <option value="FOOD">Food & Travel</option>
                                <option value="FINANCE">Finance & Business</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Bio</label>
                            <Input name="bio" value={formData.bio} onChange={handleChange} placeholder="I create content about..." className="mt-1"/>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: AUTOMATED EXTRACTION (UPDATED) */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="text-purple-500"/> Connect Platforms
                        </h2>
                        <p className="text-slate-500 text-sm">We automatically verify your followers and reach.</p>
                    </div>
                    
                    <div className="grid gap-4">
                        {/* INSTAGRAM CONNECT */}
                        <div className={`flex justify-between items-center p-4 border rounded-lg transition-all ${connected.instagram ? 'bg-green-50 border-green-200' : 'bg-white hover:border-purple-300'}`}>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                                    <Instagram size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Instagram</p>
                                    <p className="text-xs text-slate-500">{connected.instagram ? 'Data Extracted ✅' : 'Connect to extract followers'}</p>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant={connected.instagram ? "ghost" : "outline"}
                                className={connected.instagram ? "text-green-600 font-bold" : ""}
                                onClick={() => handleConnect('instagram')}
                                disabled={connected.instagram}
                            >
                                {connected.instagram ? "Connected" : "Connect"}
                            </Button>
                        </div>

                        {/* YOUTUBE CONNECT */}
                        <div className={`flex justify-between items-center p-4 border rounded-lg transition-all ${connected.youtube ? 'bg-green-50 border-green-200' : 'bg-white hover:border-purple-300'}`}>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                    <Youtube size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">YouTube</p>
                                    <p className="text-xs text-slate-500">{connected.youtube ? 'Data Extracted ✅' : 'Connect to extract subscribers'}</p>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant={connected.youtube ? "ghost" : "outline"}
                                className={connected.youtube ? "text-green-600 font-bold" : ""}
                                onClick={() => handleConnect('youtube')}
                                disabled={connected.youtube}
                            >
                                {connected.youtube ? "Connected" : "Connect"}
                            </Button>
                        </div>
                    </div>

                    {/* LIVE PREVIEW OF EXTRACTED DATA */}
                    {(connected.instagram || connected.youtube) && (
                        <div className="bg-slate-900 text-white p-4 rounded-lg mt-4 animate-in slide-in-from-bottom-2">
                            <p className="text-xs font-bold opacity-50 uppercase mb-2">Total Extracted Reach</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-extrabold">{formData.total_followers.toLocaleString()}</p>
                                    <p className="text-xs opacity-70">Verified Audience</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-400">{formData.engagement_ratio}%</p>
                                    <p className="text-xs opacity-70">Avg. Engagement</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3: GEOGRAPHY */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="text-purple-500"/> Audience Location
                        </h2>
                        <p className="text-slate-500 text-sm">Where are your followers located?</p>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700">Top Cities / Regions</label>
                            <Input name="penetrated_regions" value={formData.penetrated_regions} onChange={handleChange} placeholder="e.g. Mumbai, Delhi, Bangalore" className="mt-1"/>
                            <p className="text-xs text-slate-400 mt-1">Separate with commas.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center space-y-2">
                        <CheckCircle2 size={48} className="text-slate-900 mx-auto" />
                        <h2 className="text-2xl font-bold text-slate-900">Confirm Profile</h2>
                        <p className="text-slate-500 text-sm">Submit your channel for monetization approval.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg space-y-4 text-sm border border-slate-200">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Channel</span>
                            <span className="font-bold text-slate-900">{formData.channel_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Verified Followers</span>
                            <span className="font-bold text-slate-900">{formData.total_followers.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className={`flex items-start gap-3 p-4 rounded-md border transition-all ${isAuthorized ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input 
                            type="checkbox" 
                            id="auth-check"
                            className="mt-1 h-4 w-4 accent-purple-600"
                            checked={isAuthorized}
                            onChange={(e) => setIsAuthorized(e.target.checked)}
                        />
                        <label htmlFor="auth-check" className="text-xs cursor-pointer select-none">
                            <span className="font-bold block mb-1 flex items-center gap-2">
                                <ShieldCheck size={14} /> Creator Authorization
                            </span>
                            I confirm that I own these accounts. I authorize 30Minutes to pull real-time metrics for advertisers.
                        </label>
                    </div>
                </div>
            )}

            {/* NAVIGATION */}
            <div className="flex justify-between pt-8 border-t border-slate-100 mt-4">
                {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="flex gap-2">
                        <ChevronLeft size={16}/> Back
                    </Button>
                ) : (
                    <Button variant="ghost" disabled className="text-slate-300">Back</Button>
                )}

                {step < 4 ? (
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white flex gap-2 pl-6 pr-6" onClick={() => setStep(step + 1)}>
                        Next Step <ChevronRight size={16}/>
                    </Button>
                ) : (
                    <Button 
                        className={`font-bold pl-8 pr-8 text-white transition-all ${isAuthorized ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-300 cursor-not-allowed'}`} 
                        onClick={handleSubmit} 
                        disabled={loading || !isAuthorized}
                    >
                        {loading ? "Submitting..." : "Join Marketplace"}
                    </Button>
                )}
            </div>

        </CardContent>
      </Card>
    </div>
  );
}