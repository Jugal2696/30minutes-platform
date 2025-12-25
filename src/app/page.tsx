"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, LogIn } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Marketplace() {
  const [assets, setAssets] = useState<any[]>([]);
  const [view, setView] = useState('PACKAGES'); 
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchAssets();
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchAssets() {
    // Note: We will eventually filter this to show only APPROVED assets
    const { data } = await supabase.from('assets').select('*');
    if (data) setAssets(data);
  }

  // LOGOUT HANDLER
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  // SMART NAVIGATION HANDLER
  function handleDashboardClick() {
    // The Login page handles routing based on Role (Brand vs Creator)
    window.location.href = '/login';
  }

  const PACKAGES = [
    {
      id: "pkg_1",
      name: "The Rajkot Dominator",
      price: 45000,
      assets: ["1 Prime Billboard (15 Days)", "10 Influencer Reels", "5k WhatsApp Blast"],
      tag: "BEST SELLER",
      image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "pkg_2",
      name: "Cafe Launch Kit",
      price: 20000,
      assets: ["5 Food Bloggers", "Local News Feature", "Google Maps SEO"],
      tag: "FOR STARTUPS",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">30</div>
            <span className="font-bold text-xl tracking-tight hidden md:block">Minutes</span>
        </div>
        
        <div className="flex items-center gap-3">
             {/* THE FIX: Updated Link */}
             <Button variant="outline" onClick={handleDashboardClick} className="flex gap-2 items-center border-slate-300">
                <LayoutDashboard size={16} />
                {user ? "My Dashboard" : "Partner Login"}
             </Button>
             
             {user && (
                 <Button 
                    variant="ghost" 
                    className="text-red-600 font-bold hover:bg-red-50 hover:text-red-700"
                    onClick={handleSignOut}
                 >
                    Sign Out
                 </Button>
             )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* HERO */}
        <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Create Your <span className="text-blue-600">Market.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto">
                The enterprise platform for local ad space. Connect with premium billboards, influencers, and media owners in minutes.
            </p>
            
            <div className="flex justify-center gap-4">
                <Button onClick={() => setView('PACKAGES')} className={`h-12 px-8 font-bold rounded-full transition-all ${view === 'PACKAGES' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                    VIP Packages
                </Button>
                <Button onClick={() => setView('ASSETS')} className={`h-12 px-8 font-bold rounded-full transition-all ${view === 'ASSETS' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                    Individual Assets
                </Button>
            </div>
        </div>

        {/* VIEW: PACKAGES */}
        {view === 'PACKAGES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {PACKAGES.map((pkg) => (
                    <Card key={pkg.id} className="overflow-hidden hover:shadow-xl transition-all border-0 shadow-md group cursor-pointer bg-white">
                        <div className="h-64 overflow-hidden relative">
                            <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 font-extrabold px-3 py-1 text-xs rounded shadow-sm">{pkg.tag}</span>
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                                <p className="text-white/80 text-sm">Complete Launch Solution</p>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-3xl font-bold text-slate-900">₹{pkg.price.toLocaleString()}</span>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold text-white rounded-xl shadow-blue-200 shadow-lg" 
                                onClick={() => window.open(`https://wa.me/919999999999?text=I want to activate package: ${pkg.name}`)}>
                                LAUNCH CAMPAIGN 🚀
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}

        {/* VIEW: LIVE ASSETS */}
        {view === 'ASSETS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {assets.length === 0 ? (
                    <div className="col-span-3 text-center py-20 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-xl text-slate-400 font-medium">Marketplace Inventory Loading...</p>
                    </div>
                ) : assets.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-all border-slate-200 bg-white group">
                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                             <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-4xl group-hover:scale-110 transition-transform">
                                {item.type === 'OOH_BILLBOARD' ? '🏢' : item.type === 'INFLUENCER' ? '📱' : '⚡'}
                             </div>
                             <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">AVAILABLE</span>
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded uppercase tracking-wide text-slate-500">{item.type.replace('_', ' ')}</span>
                            </div>
                            <CardTitle className="text-lg mt-2 leading-tight text-slate-900 line-clamp-1">{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-bold text-xl text-slate-900">₹{item.base_price_per_day}</span>
                                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-700 font-bold" 
                                    onClick={() => window.location.href = `/assets/${item.id}`}>
                                    Promote
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}