"use client";
import { useEffect, useState } from "react";
// ✅ Using the SSR-compatible client to prevent loops
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkAdmin() {
      // 1. Get User from secure Cookie
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // 2. Get Role with Super Admin Priority
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // 3. 🛑 CTO FIX: ALLOW 'SUPER_ADMIN' ACCESS
      if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
        setIsAuthorized(true);
      } else {
        // Redirect unauthorized users based on their specific profile
        if (profile?.role === 'BUSINESS') window.location.href = '/dashboard/business';
        else if (profile?.role === 'CREATOR') window.location.href = '/dashboard/creator';
        else window.location.href = '/login'; 
        return;
      }
      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white font-mono">
        <Loader2 className="animate-spin h-8 w-8 mb-4 text-blue-500" /> 
        <span className="tracking-widest uppercase text-xs opacity-50">Verifying Clearance...</span>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 🏆 THE GLOBAL GOD MODE HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 text-white p-4 font-bold flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="tracking-tighter text-lg uppercase">30Minutes GOD MODE</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase">System: Operational</span>
            <span className="text-xs bg-red-600/20 text-red-500 border border-red-600/50 px-3 py-1 rounded-full font-black tracking-widest">
                SUPER ADMIN
            </span>
        </div>
      </div>
      
      {/* 🚀 THE DYNAMIC CONTENT AREA */}
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}