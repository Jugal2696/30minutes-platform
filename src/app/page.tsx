"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- DUMMY DATA (Safe Mode: This WORKS) ---
const ASSETS = [
  {
    id: 1,
    name: "Yagnik Road Prime Billboard",
    type: "OOH",
    price: 15000,
    image: "https://images.unsplash.com/photo-1562654501-a03df04bab0e?q=80&w=800&auto=format&fit=crop",
    status: "AVAILABLE"
  },
  {
    id: 2,
    name: "Influencer: Rajkot Foodie",
    type: "INFLUENCER",
    price: 5000,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
    status: "AVAILABLE"
  },
  {
    id: 3,
    name: "Kalavad Road Hoarding",
    type: "OOH",
    price: 25000,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    status: "BOOKED"
  },
  {
    id: 4,
    name: "Guerrilla Stunt: Blue Tape",
    type: "GUERRILLA",
    price: 8000,
    image: "https://images.unsplash.com/photo-1511553677255-ba939e5537e0?q=80&w=800&auto=format&fit=crop",
    status: "AVAILABLE"
  }
];

export default function Marketplace() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">30</span>
           </div>
           <h1 className="text-xl font-bold text-blue-900 tracking-tight">30Minutes</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-slate-600">For Vendors</Button>
          <Button className="bg-blue-700 hover:bg-blue-800 text-white">Login</Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-14 text-center bg-white p-12 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
            Dominate Rajkot in <span className="text-blue-700">30 Minutes.</span>
          </h2>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            The first trusted marketplace for verified Billboards, Influencers, and Guerrilla Marketing.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="h-12 px-8 bg-blue-700 hover:bg-blue-800 text-white font-semibold">Browse Assets</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ASSETS.map((item) => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-slate-200 bg-white rounded-xl">
              <div className="h-60 bg-gray-200 w-full relative overflow-hidden">
                 <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <Badge className={`absolute top-4 right-4 shadow-md ${item.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {item.status}
                 </Badge>
              </div>
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex justify-between items-start mb-2">
                   <Badge variant="secondary" className="text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium px-2 py-0.5">
                      {item.type}
                   </Badge>
                   <span className="text-lg font-bold text-slate-900">₹{item.price.toLocaleString()}</span>
                </div>
                <CardTitle className="text-xl text-slate-900 leading-snug">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-6">
                <Button className="w-full bg-blue-700 hover:bg-blue-800 h-12 font-semibold text-white shadow-md" 
                  onClick={() => window.open(`https://wa.me/919999999999?text=I want to book ${item.name}`)}>
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}