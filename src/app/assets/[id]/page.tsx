"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AssetDetails() {
  const params = useParams(); 
  const [asset, setAsset] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    if (params.id) {
      supabase.from('assets').select('*, businesses(name, city)').eq('id', params.id).single()
        .then(({ data }) => setAsset(data));
    }
  }, [params.id]);

  async function handleBooking() {
    if (!user) {
        window.location.href = '/login';
        return;
    }
    if (!startDate || !endDate) return alert("Please select both dates!");
    
    setLoading(true);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days < 0) {
        setLoading(false);
        return alert("End date cannot be before Start date!");
    }
    
    // Treat same-day as 1 day
    if (days === 0) days = 1;

    // --- CRITICAL FIX: ENFORCE MINIMUM DAYS ---
    // If the asset has a rule (e.g., 15 days), enforce it. 
    // If no rule exists, default to 1 day.
    const minDays = asset.min_booking_days || 1; 

    if (days < minDays) {
        setLoading(false);
        return alert(`🚫 INVALID DURATION: This asset requires a minimum booking of ${minDays} days.`);
    }

    const total = days * asset.base_price_per_day;

    const { error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      asset_id: asset.id,
      start_date: startDate,
      end_date: endDate,
      total_price: total,
      status: 'CONFIRMED', 
      payment_status: 'PENDING'
    });

    if (error) {
      alert("Booking Failed: " + error.message);
    } else {
      alert(`SUCCESS! Booking Confirmed for ${days} Days. Total: ₹${total}.`);
      window.location.href = '/'; 
    }
    setLoading(false);
  }

  if (!asset) return <div className="p-10 text-center text-[#0F3057]">Loading Asset...</div>;

  return (
    <div className="min-h-screen bg-[#E3F2FD] p-6 font-sans flex justify-center items-center">
      <Card className="w-full max-w-4xl bg-white shadow-2xl border-0 overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT: VISUALS */}
        <div className="md:w-1/2 bg-gray-100 relative h-64 md:h-auto">
             <div className="absolute inset-0 flex items-center justify-center text-[#0F3057] opacity-20 font-bold text-4xl uppercase">
                {asset.type.replace('_', ' ')}
             </div>
             <span className="absolute top-4 left-4 bg-[#E65100] text-white px-3 py-1 text-xs font-bold rounded">
                {asset.status}
             </span>
             {/* Show Min Days Tag */}
             <span className="absolute bottom-4 left-4 bg-[#0F3057] text-white px-3 py-1 text-xs font-bold rounded">
                Min. {asset.min_booking_days || 1} Days
             </span>
        </div>

        {/* RIGHT: DETAILS & BOOKING */}
        <div className="md:w-1/2 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-[#0F3057] leading-tight">{asset.name}</h1>
                <p className="text-gray-500 mt-1">Managed by: <span className="font-bold">{asset.businesses?.name}</span></p>
            </div>

            <div className="flex justify-between items-center mb-8 p-4 bg-[#E3F2FD] rounded-lg">
                <span className="text-[#0F3057] font-bold">Daily Rate</span>
                <span className="text-2xl font-extrabold text-[#E65100]">₹{asset.base_price_per_day}</span>
            </div>

            {/* BOOKING ENGINE */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-[#0F3057] uppercase">Start Date</label>
                        <Input type="date" className="border-[#0F3057] text-[#0F3057]" onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[#0F3057] uppercase">End Date</label>
                        <Input type="date" className="border-[#0F3057] text-[#0F3057]" onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                <Button 
                    onClick={handleBooking} 
                    className="w-full h-14 bg-[#0F3057] hover:bg-[#0a2342] text-white text-lg font-bold shadow-lg"
                    disabled={loading}
                >
                    {loading ? "Processing..." : user ? "CONFIRM BOOKING ⚡" : "Login to Book"}
                </Button>
                
                <p className="text-xs text-center text-gray-400">
                    Asset requires minimum {asset.min_booking_days || 1} days.
                </p>
            </div>
        </div>
      </Card>
    </div>
  );
}