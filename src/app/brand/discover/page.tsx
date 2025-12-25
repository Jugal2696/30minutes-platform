"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, ListPlus, ChevronDown, ChevronUp, MapPin, Users, BarChart3, Wallet } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BrandDiscovery() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [savedCreators, setSavedCreators] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function init() {
      // 1. Auth & Role Check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      // 2. Business Verification Check
      const { data: business } = await supabase
        .from('businesses')
        .select('id, verification_status')
        .eq('profile_id', user.id)
        .single();

      if (!business || business.verification_status !== 'APPROVED') {
        window.location.href = '/onboarding/pending';
        return;
      }

      // 3. Fetch Matches & Public Profiles
      // Note: We join match_scores with creator_public_profiles
      const { data: scoredCreators, error } = await supabase
        .from('match_scores')
        .select(`
          *,
          creator:creator_public_profiles (
            id,
            channel_name,
            primary_niche,
            primary_region,
            total_followers,
            average_reach,
            engagement_ratio
          )
        `)
        .eq('business_id', business.id)
        .order('final_score', { ascending: false });

      if (scoredCreators) setMatches(scoredCreators);
      
      // 4. Fetch Saved State
      const { data: saved } = await supabase
        .from('saved_creators')
        .select('creator_id')
        .eq('business_id', business.id);
        
      if (saved) {
          setSavedCreators(new Set(saved.map(s => s.creator_id)));
      }

      setLoading(false);
    }
    init();
  }, []);

  async function toggleSave(creatorId: string, businessId: string) {
    if (savedCreators.has(creatorId)) {
        // Unsave
        await supabase.from('saved_creators').delete().match({ business_id: businessId, creator_id: creatorId });
        setSavedCreators(prev => {
            const next = new Set(prev);
            next.delete(creatorId);
            return next;
        });
    } else {
        // Save
        await supabase.from('saved_creators').insert({ business_id: businessId, creator_id: creatorId });
        setSavedCreators(prev => new Set(prev).add(creatorId));
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-900" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold">B</div>
               <span className="font-bold text-lg tracking-tight">Discovery Engine</span>
            </div>
            <Button variant="ghost" onClick={() => window.location.href='/dashboard/brand'}>Back to Dashboard</Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Recommended Creators</h1>
            <p className="text-slate-500">AI-ranked matches based on your brand preferences.</p>
        </div>

        {matches.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 font-medium">No matches calculated yet.</p>
                <p className="text-sm text-slate-400 mt-1">Update your Brand Preferences to generate scores.</p>
                <Button className="mt-4" onClick={() => window.location.href='/dashboard/brand'}>Update Preferences</Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                    <Card key={match.id} className="border-slate-200 hover:shadow-lg transition-all duration-300 group bg-white">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">{match.creator.channel_name}</CardTitle>
                                    <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600 hover:bg-slate-200">
                                        {match.creator.primary_niche}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black ${match.final_score > 75 ? 'text-green-600' : match.final_score > 50 ? 'text-yellow-600' : 'text-slate-400'}`}>
                                        {match.final_score}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Score</div>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                            {/* METRICS GRID */}
                            <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-slate-100">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Users size={16} className="text-slate-400" />
                                    <span className="font-bold text-slate-900">{match.creator.total_followers.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <BarChart3 size={16} className="text-slate-400" />
                                    <span className="font-bold text-slate-900">{match.creator.engagement_ratio}%</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span className="truncate max-w-[100px]">{match.creator.primary_region || 'Global'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Wallet size={16} className="text-slate-400" />
                                    <span>~{match.creator.average_reach.toLocaleString()} Reach</span>
                                </div>
                            </div>

                            {/* SCORE BREAKDOWN (Explainable AI) */}
                            <div className="space-y-2">
                                <button 
                                    onClick={() => setExpandedScore(expandedScore === match.id ? null : match.id)}
                                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full"
                                >
                                    {expandedScore === match.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    Why this match?
                                </button>
                                
                                {expandedScore === match.id && (
                                    <div className="bg-slate-50 p-3 rounded-md text-xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Niche Fit</span>
                                            <span className={`font-bold ${match.niche_score > 0 ? 'text-green-600' : 'text-slate-400'}`}>+{match.niche_score}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Region Fit</span>
                                            <span className={`font-bold ${match.region_score > 0 ? 'text-green-600' : 'text-slate-400'}`}>+{match.region_score}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Budget Fit</span>
                                            <span className={`font-bold ${match.budget_score > 0 ? 'text-green-600' : 'text-slate-400'}`}>+{match.budget_score}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Engagement Quality</span>
                                            <span className={`font-bold ${match.engagement_score > 0 ? 'text-green-600' : 'text-slate-400'}`}>+{match.engagement_score}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    className={`flex-1 gap-2 ${savedCreators.has(match.creator.id) ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`} 
                                    variant="outline"
                                    onClick={() => toggleSave(match.creator.id, match.business_id)}
                                >
                                    <Star size={16} className={savedCreators.has(match.creator.id) ? "fill-yellow-600" : ""} />
                                    {savedCreators.has(match.creator.id) ? "Saved" : "Save"}
                                </Button>
                                <Button className="flex-1 gap-2 bg-slate-900 text-white hover:bg-slate-800" disabled>
                                    <ListPlus size={16} /> Shortlist
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}