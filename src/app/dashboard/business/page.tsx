"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation';
import { 
  Search, Zap, MapPin, TrendingUp, Package, 
  Loader2, Clock, LayoutGrid, LogOut
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  semantic_search, 
  rtb_opportunities, 
  campaign_bundles, 
  type SearchResult, 
  type RTBOpportunity, 
  type CampaignBundle 
} from '@/lib/api/demand';

export default function DemandEngine() {
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 
  const supabase = createClient();
  const [businessName, setBusinessName] = useState("");

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [rtbItems, setRtbItems] = useState<RTBOpportunity[]>([]);
  const [bundles, setBundles] = useState<CampaignBundle[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user }, error } = await supabase.auth.getUser();
      // Explicit null check to avoid shell expansion issues
      if (error || user === null) { router.replace('/login'); return; }

      const { data: bizData } = await supabase
        .from('businesses')
        .select('business_name, verification_status')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (bizData === null) { router.push('/onboarding/role-selection'); return; }
      if (bizData.verification_status === 'PENDING') { router.push('/onboarding/pending'); return; }
      if (bizData.verification_status !== 'APPROVED') { router.push('/onboarding/buisness'); return; }

      setBusinessName(bizData.business_name);

      const [rtbData, bundleData] = await Promise.all([
        rtb_opportunities(),
        campaign_bundles()
      ]);
      
      setRtbItems(rtbData);
      setBundles(bundleData);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  async function handleSearch() {
    if (searchQuery === "") return;
    setIsSearching(true);
    const results = await semantic_search(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-purple-500 h-10 w-10 mb-4" />
        <p className="text-xs font-mono text-slate-400">CONNECTING TO DEMAND GRID...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-20">
      
      <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-12 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center font-bold">OM</div>
                    <span className="font-mono text-sm text-slate-400">DEMAND_SIDE_V1.0</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-300">{businessName}</span>
                    <Button variant="outline" className="border-slate-700 text-slate-300 h-8 text-xs">Wallet: $0.00</Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        <LogOut size={16} />
                    </Button>
                </div>
            </div>

            <div className="max-w-3xl">
                <h1 className="text-4xl font-extrabold text-white mb-4">
                    What is your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">intent</span> today?
                </h1>
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative flex shadow-2xl">
                        <div className="bg-slate-800 flex items-center pl-4 rounded-l-lg border border-r-0 border-slate-700">
                            <Search className="text-slate-400" />
                        </div>
                        <Input 
                            className="h-16 bg-slate-800 border-l-0 border-slate-700 text-lg placeholder:text-slate-500 focus-visible:ring-0 rounded-l-none rounded-r-none" 
                            placeholder='e.g. "Promote my coffee shop in Downtown to Gen Z"'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button 
                            className="h-16 px-8 rounded-l-none rounded-r-lg bg-white text-slate-950 font-bold text-lg hover:bg-slate-200"
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? <Loader2 className="animate-spin" /> : "Launch"}
                        </Button>
                    </div>
                </div>
                
                {searchResults.length > 0 && (
                    <div className="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-4 animate-in slide-in-from-top-2">
                        <p className="text-xs font-mono text-green-400 mb-2">:: VECTOR MATCH FOUND ({searchResults.length})</p>
                        <div className="space-y-2">
                            {searchResults.map(res => (
                                <div key={res.id} className="flex justify-between items-center p-2 hover:bg-slate-800 rounded cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] bg-slate-950">{res.type}</Badge>
                                        <span className="font-bold text-sm text-slate-200">{res.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-mono text-white">${res.price}</span>
                                        <span className="text-[10px] text-slate-500">Relevance: {(res.relevanceScore * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="text-yellow-400 fill-yellow-400" size={20}/> Live Opportunities (RTB)
                </h2>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 animate-pulse">LIVE FEED ACTIVE</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rtbItems.map((item) => (
                    <Card key={item.id} className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-all cursor-pointer group">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <Badge className="bg-red-900/50 text-red-400 border-0 text-[10px] flex items-center gap-1">
                                    <Clock size={10} /> EXPIRES SOON
                                </Badge>
                                <span className="font-mono text-green-400 text-sm">${item.current_bid} BID</span>
                            </div>
                            <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{item.slot_name}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {item.trending_signal === 'HIGH_FOOTFALL' ? 'High Footfall Detected' : 'Viral Spike Detected'} • {item.impression_forecast.toLocaleString()} Impressions
                            </p>
                            <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full w-[70%]"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="text-purple-400" size={20}/> City Domination Bundles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {bundles.map((bundle) => (
                    <Card key={bundle.id} className="bg-slate-900 border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-purple-900/20 transition-all">
                        <div className={`h-32 bg-gradient-to-br relative p-6 ${
                            bundle.type === 'DOMINATION' ? 'from-blue-900 to-slate-900' : 
                            bundle.type === 'DIGITAL_BLITZ' ? 'from-pink-900 to-slate-900' : 
                            'from-slate-800 to-slate-900'
                        }`}>
                            {bundle.type === 'DOMINATION' && <MapPin className="text-blue-400 mb-2"/>}
                            {bundle.type === 'DIGITAL_BLITZ' && <TrendingUp className="text-pink-400 mb-2"/>}
                            {bundle.type === 'CUSTOM' && <LayoutGrid className="text-slate-400 mb-2"/>}
                            <h3 className="text-2xl font-extrabold text-white">{bundle.name}</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">Billboards</span>
                                    <span className="text-white">{bundle.assets.billboards}x Units</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">Influencers</span>
                                    <span className="text-white">{bundle.assets.influencers}x Voices</span>
                                </div>
                                <div className="flex justify-between text-sm pb-2">
                                    <span className="text-slate-400">Est. Reach</span>
                                    <span className="text-green-400 font-mono">{(bundle.est_reach / 1000000).toFixed(1)}M Impressions</span>
                                </div>
                            </div>
                            <Button className="w-full bg-white text-slate-950 font-bold hover:bg-purple-400 hover:text-white transition-all">
                                Deploy Bundle (${bundle.price.toLocaleString()})
                            </Button>
                        </CardContent>
                    </Card>
                ))}

            </div>
        </div>

      </div>
    </div>
  );
}
