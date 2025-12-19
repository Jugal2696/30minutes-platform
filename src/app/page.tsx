"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Initialize Supabase (Put your keys here later)
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export default function Marketplace() {
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    // Fetch assets from DB
    const fetchAssets = async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (data) setAssets(data);
    };
    fetchAssets();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-blue-900 tracking-tight">30Minutes</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">Vendor Login</Button>
      </div>

      {/* Hero Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm mb-12 border border-blue-100">
        <h2 className="text-2xl font-bold mb-4">Find Ad Space in Rajkot</h2>
        <div className="flex gap-4">
          <Button variant="outline">🏢 Billboards</Button>
          <Button variant="outline">📱 Influencers</Button>
          <Button variant="outline">⚡ Stunts</Button>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assets.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-all cursor-pointer">
            <div className="h-48 bg-gray-200 w-full object-cover">
               {/* Image placeholder */}
               <img src={item.image_url} className="w-full h-full object-cover rounded-t-xl" />
            </div>
            <CardHeader>
              <div className="flex justify-between">
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.type}</span>
                 <span className="text-green-700 font-bold">₹{item.price_per_day}/day</span>
              </div>
              <CardTitle className="mt-2 text-lg">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-black text-white" 
                onClick={() => window.open(`https://wa.me/919999999999?text=Booking ${item.name}`)}>
                Book Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}