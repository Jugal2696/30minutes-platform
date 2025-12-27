"use client";
import { useEffect, useState } from "react";
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
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // 2. Get Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // 3. 🛑 CTO FIX: ALLOW 'SUPER_ADMIN' ACCESS
      if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
        setIsAuthorized(true);
      } else {
        // If they are not admin, send them to their respective dashboard
        if (profile?.role === 'BUSINESS') window.location.href = '/dashboard/business';
        else if (profile?.role === 'CREATOR') window.location.href = '/dashboard/creator';
        else window.location.href = '/login'; 
      }
      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin mr-2" /> Verifying Clearance...
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Admin Sidebar or Header could go here */}
      <div className="bg-slate-900 text-white p-4 font-bold flex justify-between">
        <span>30Minutes GOD MODE</span>
        <span className="text-xs bg-red-600 px-2 py-1 rounded">SUPER ADMIN</span>
      </div>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}