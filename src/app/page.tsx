"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Marketplace() {
  const [assets, setAssets] = useState<any[]>([]);
  const [view, setView] = useState('PACKAGES'); 

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    const { data } = await supabase.from('assets').select('*');
    if (data) setAssets(data);
  }

  // --- VIP PACKAGES ---
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
    <main className="min-h-screen bg-[#E3F2FD] font-sans text-[#0F3057]">
      {/* HEADER */}
      <nav className="bg-white border-b border-[#E3F2FD] px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center">
            <img src="/logo.png" alt="30Minutes" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display='none'} />
        </div>
        <div className="space-x-3">
             <Button variant="outline" onClick={() => window.location.href='/vendor'} className="border-[#0F3057] text-[#0F3057] hover:bg-[#E3F2FD] font-bold">
                Vendor Dashboard
             </Button>
             <Button className="bg-[#0F3057] hover:bg-[#0a2342] text-white font-bold">
                My Bookings
             </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* HERO */}
        <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold text-[#0F3057] mb-2 tracking-tight">Create Your Market.</h2>
            <p className="text-xl text-[#E65100] font-bold mb-8">Dominate Local Ad Space in Minutes.</p>
            <div className="flex justify-center gap-4">
                <Button onClick={() => setView('PACKAGES')} className={`h-12 px-8 font-bold ${view === 'PACKAGES' ? 'bg-[#E65100] text-white' : 'bg-white text-[#0F3057] border border-[#0F3057]'}`}>
                    VIP Packages
                </Button>
                <Button onClick={() => setView('ASSETS')} className={`h-12 px-8 font-bold ${view === 'ASSETS' ? 'bg-[#E65100] text-white' : 'bg-white text-[#0F3057] border border-[#0F3057]'}`}>
                    Individual Assets
                </Button>
            </div>
        </div>

        {/* VIEW: PACKAGES */}
        {view === 'PACKAGES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {PACKAGES.map((pkg) => (
                    <Card key={pkg.id} className="overflow-hidden hover:shadow-2xl transition-all border-0 shadow-lg group cursor-pointer bg-white">
                        <div className="h-56 overflow-hidden relative">
                            <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <span className="absolute top-4 right-4 bg-[#0F3057] text-white font-extrabold px-3 py-1 text-xs rounded shadow-md">{pkg.tag}</span>
                        </div>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-2xl text-[#0F3057]">
                                {pkg.name}
                                <span className="text-[#E65100] bg-[#E3F2FD] px-3 py-1 rounded">₹{pkg.price.toLocaleString()}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-[#E65100] hover:bg-[#cc4800] h-14 text-lg font-bold text-white" 
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {assets.length === 0 ? (
                    <div className="col-span-3 text-center py-20">
                        <p className="text-xl text-[#0F3057] font-medium">Connecting to Live Database...</p>
                    </div>
                ) : assets.map((item) => (
                    <Card key={item.id} className="hover:shadow-xl transition-all border-[#E3F2FD] bg-white">
                        <div className="h-40 bg-[#E3F2FD] relative">
                             <div className="w-full h-full flex items-center justify-center text-[#0F3057] opacity-40 font-bold text-2xl">
                                {item.type === 'OOH_BILLBOARD' ? '🏢' : item.type === 'INFLUENCER' ? '📱' : '⚡'}
                             </div>
                             <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">AVAILABLE</span>
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold bg-[#E3F2FD] px-2 py-1 rounded uppercase tracking-wide text-[#0F3057]">{item.type.replace('_', ' ')}</span>
                                <span className="font-bold text-lg text-[#E65100]">₹{item.base_price_per_day}</span>
                            </div>
                            <CardTitle className="text-lg mt-2 leading-tight text-[#0F3057]">{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-white text-[#0F3057] border border-[#0F3057] hover:bg-[#E3F2FD] font-bold" 
                                onClick={() => window.location.href = `/assets/${item.id}`}>
                                Promote Now
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}