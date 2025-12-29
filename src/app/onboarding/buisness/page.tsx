"use client";
import { useState, useEffect } from 'react';
// ✅ CTO FIX: Switch to Shared Client to prevent Auth Loop
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2, Target, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Share2, Map, Zap, Users2 } from 'lucide-react';

export default function BrandOnboarding() {
  // ✅ INITIALIZE SHARED CLIENT
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // 🆕 STATE: Tracks what vertical the user selected previously (OOH, GUERRILLA, CO_BRANDING)
  const [businessType, setBusinessType] = useState<string>('GENERIC');

  const [formData, setFormData] = useState({
    business_name: '',
    legal_entity_name: '',
    website_url: '',
    business_email: '',
    phone_number: '',
    // Dynamic Fields Data
    inventory_count: '', // For OOH
    team_size: '',       // For Guerrilla
    barter_value: '',    // For Co-Brand
    categories: '', 
    operating_regions: '', 
    target_audience: '',
    brand_description: '',
    promotion_goals: [] as string[],
    monthly_budget: '',
    instagram: '',
    linkedin: '',
    youtube: ''
  });

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      setUser(data.user);

      // ✅ LOGIC UPDATE: Check for existing record AND its status
      const { data: existing } = await supabase
        .from('businesses')
        .select('id, business_type, verification_status')
        .eq('profile_id', data.user.id)
        .single();
      
      // If they are fully approved, send to dashboard
      if (existing?.verification_status === 'APPROVED') {
        window.location.href = '/dashboard/business';
        return;
      }

      // If they have submitted and are waiting, send to pending
      // BUT if status is 'PENDING_FORM' (from Type Selection), let them stay here
      if (existing?.verification_status === 'PENDING') {
        window.location.href = '/onboarding/pending';
        return;
      }
      
      // Load the selected type to customize the UI
      if (existing?.business_type) {
        setBusinessType(existing.business_type);
      }
    }
    init();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (value: string) => {
    const current = formData.promotion_goals;
    if (current.includes(value)) {
        setFormData({ ...formData, promotion_goals: current.filter(i => i !== value) });
    } else {
        setFormData({ ...formData, promotion_goals: [...current, value] });
    }
  };

  async function handleSubmit() {
    if (!user) return;
    if (!isAuthorized) return alert("You must confirm authorization to proceed.");
    
    setLoading(true);

    const combinedDescription = `
      [TYPE: ${businessType}]
      ${formData.brand_description}
      ---
      [ASSETS]
      Inventory Count: ${formData.inventory_count || 'N/A'}
      Team Size: ${formData.team_size || 'N/A'}
      Barter Value: ${formData.barter_value || 'N/A'}
      
      [SOCIAL SIGNALS]
      Instagram: ${formData.instagram || 'N/A'}
      LinkedIn: ${formData.linkedin || 'N/A'}
      YouTube: ${formData.youtube || 'N/A'}
      
      [INTENT DATA]
      Goals: ${formData.promotion_goals.join(', ')}
      Budget: ${formData.monthly_budget}
    `.trim();

    const payload = {
        // We do NOT include profile_id here because we are UPDATING an existing record
        business_name: formData.business_name,
        legal_entity_name: formData.legal_entity_name,
        website_url: formData.website_url,
        business_email: formData.business_email,
        phone_number: formData.phone_number,
        categories: formData.categories.split(',').map(s => s.trim()).filter(Boolean),
        operating_regions: formData.operating_regions.split(',').map(s => s.trim()).filter(Boolean),
        target_audience_description: formData.target_audience,
        brand_description: combinedDescription,
        verification_status: 'PENDING' // Change status from PENDING_FORM to PENDING
    };

    // ✅ LOGIC UPDATE: Use Update instead of Insert (Record exists from Type Selection)
    const { error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('profile_id', user.id);

    if (error) {
        alert("Submission Error: " + error.message);
        setLoading(false);
    } else {
        // 📧 SEND ADMIN NOTIFICATION
        try {
            await fetch('/api/send-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: `Business (${businessType})`,
                    name: formData.business_name,
                    email: formData.business_email
                })
            });
        } catch (err) {
            console.error("Email Alert Failed", err);
        }

        window.location.href = '/onboarding/pending';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-6 font-sans">
      <Card className="w-full max-w-3xl shadow-lg border-0 h-fit">
        <CardHeader className="border-b border-slate-100 bg-white rounded-t-xl pb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    {/* Dynamic Header Label */}
                    {businessType === 'OOH' && <Map size={14}/>}
                    {businessType === 'GUERRILLA' && <Zap size={14}/>}
                    {businessType === 'CO_BRANDING' && <Users2 size={14}/>}
                    {businessType.replace('_', ' ')} Onboarding
                </span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">Step {step} of 4</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                <div className="bg-slate-900 h-2 rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="text-slate-400"/> Business Identity
                        </h2>
                        <p className="text-slate-500 text-sm">Establish your legal legitimacy on the platform.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-sm font-bold text-slate-700">Business Name</label>
                            <Input name="business_name" value={formData.business_name} onChange={handleChange} placeholder="e.g. Acme Inc" className="mt-1"/>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-sm font-bold text-slate-700">Legal Entity Name</label>
                            <Input name="legal_entity_name" value={formData.legal_entity_name} onChange={handleChange} placeholder="e.g. Acme Corp Ltd." className="mt-1"/>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-bold text-slate-700">Website URL</label>
                            <Input name="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://..." className="mt-1"/>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-sm font-bold text-slate-700">Official Email</label>
                            <Input name="business_email" type="email" value={formData.business_email} onChange={handleChange} className="mt-1"/>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-sm font-bold text-slate-700">Phone</label>
                            <Input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+1..." className="mt-1"/>
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900">Market Positioning</h2>
                        <p className="text-slate-500 text-sm">Define where and who you serve.</p>
                    </div>
                    <div className="space-y-4">
                        
                        {/* 🛑 DYNAMIC FIELDS BASED ON SELECTION */}
                        {businessType === 'OOH' && (
                            <div>
                                <label className="text-sm font-bold text-slate-700">Total Asset Count</label>
                                <Input name="inventory_count" value={formData.inventory_count} onChange={handleChange} placeholder="Number of screens/billboards" className="mt-1"/>
                            </div>
                        )}
                        {businessType === 'GUERRILLA' && (
                            <div>
                                <label className="text-sm font-bold text-slate-700">Field Team Size</label>
                                <Input name="team_size" value={formData.team_size} onChange={handleChange} placeholder="Number of active agents" className="mt-1"/>
                            </div>
                        )}
                        {businessType === 'CO_BRANDING' && (
                            <div>
                                <label className="text-sm font-bold text-slate-700">Estimated Barter Value ($)</label>
                                <Input name="barter_value" value={formData.barter_value} onChange={handleChange} placeholder="Value of goods/services for swap" className="mt-1"/>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-bold text-slate-700">Categories</label>
                            <Input name="categories" value={formData.categories} onChange={handleChange} placeholder="e.g. Fashion, Retail, Tech (comma separated)" className="mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Operating Regions</label>
                            <Input name="operating_regions" value={formData.operating_regions} onChange={handleChange} placeholder="e.g. New York, London, Tokyo" className="mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Target Audience</label>
                            <textarea name="target_audience" value={formData.target_audience} onChange={handleChange} placeholder="Describe your ideal customer..." className="w-full mt-1 p-3 border rounded-md min-h-[100px] text-sm"/>
                        </div>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Target className="text-slate-400"/> Presence & Intent
                        </h2>
                        <p className="text-slate-500 text-sm">Signal your seriousness to creators.</p>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Share2 size={16} /> Digital Presence (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram URL" className="bg-white" />
                                <Input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="LinkedIn URL" className="bg-white" />
                                <Input name="youtube" value={formData.youtube} onChange={handleChange} placeholder="YouTube URL" className="bg-white" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Brand Description</label>
                            <textarea name="brand_description" value={formData.brand_description} onChange={handleChange} placeholder="Tell us about your brand story..." className="w-full mt-1 p-3 border rounded-md min-h-[120px] text-sm"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-3 block">Promotion Goals</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Brand Awareness', 'Sales Conversion', 'Product Launch', 'Market Expansion'].map((goal) => (
                                    <div key={goal} onClick={() => handleCheckbox(goal)} className={`p-3 border rounded-lg cursor-pointer text-sm font-medium transition-all ${formData.promotion_goals.includes(goal) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{goal}</div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Monthly Ad Spend Capacity</label>
                            <select name="monthly_budget" value={formData.monthly_budget} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                <option value="">Select Range...</option>
                                <option value="< $1k">Less than Rs.1k / mo</option>
                                <option value="$1k - $5k">Rs.1k - Rs.5k / mo</option>
                                <option value="$5k - $20k">Rs.5k - Rs.20k / mo</option>
                                <option value="$20k+">Rs.20k+ / mo</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
            {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center space-y-2">
                        <CheckCircle2 size={48} className="text-slate-900 mx-auto" />
                        <h2 className="text-2xl font-bold text-slate-900">Review & Submit</h2>
                        <p className="text-slate-500 text-sm">Confirm details before verification.</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-lg space-y-4 text-sm border border-slate-200">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Brand</span>
                            <span className="font-bold text-slate-900">{formData.business_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Legal Entity</span>
                            <span className="font-bold text-slate-900">{formData.legal_entity_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Email</span>
                            <span className="font-bold text-slate-900">{formData.business_email}</span>
                        </div>
                        {/* Dynamic Review Field */}
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Type</span>
                            <span className="font-bold text-slate-900">{businessType}</span>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-md border transition-all ${isAuthorized ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input type="checkbox" id="auth-check" className="mt-1 h-4 w-4" checked={isAuthorized} onChange={(e) => setIsAuthorized(e.target.checked)}/>
                        <label htmlFor="auth-check" className="text-xs cursor-pointer select-none">
                            <span className="font-bold block mb-1 flex items-center gap-2"><ShieldCheck size={14} /> Legal Authorization Required</span>
                            I confirm that I am legally authorized to represent this brand and submit information for verification. I understand that false representation will result in a permanent ban.
                        </label>
                    </div>
                </div>
            )}
            <div className="flex justify-between pt-8 border-t border-slate-100 mt-4">
                {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="flex gap-2"><ChevronLeft size={16}/> Back</Button>
                ) : (
                    <Button variant="ghost" disabled className="text-slate-300">Back</Button>
                )}
                {step < 4 ? (
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white flex gap-2 pl-6 pr-6" onClick={() => setStep(step + 1)}>Next Step <ChevronRight size={16}/></Button>
                ) : (
                    <Button className={`font-bold pl-8 pr-8 text-white transition-all ${isAuthorized ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-300 cursor-not-allowed'}`} onClick={handleSubmit} disabled={loading || !isAuthorized}>
                        {loading ? "Submitting..." : "Submit Application"}
                    </Button>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}