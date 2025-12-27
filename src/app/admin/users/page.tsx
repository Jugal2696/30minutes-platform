"use client";
import { useEffect, useState } from 'react';
// ✅ UPDATE: Switched to internal Cookie Client to maintain session integrity
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle2, XCircle, UserCog, ArrowLeft, Unlock, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function UserManager() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    // 1. ✅ UPDATE: STRICT GOD-MODE ACCESS CONTROL
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
        window.location.href = '/admin';
        return;
    }
    fetchUsers();
  }

  async function fetchUsers() {
    setLoading(true);
    
    // FETCH MULTI-TABLE DATA FOR IDENTITY MERGING
    const { data: profiles } = await supabase.from('profiles').select('id, email, created_at, role, last_sign_in_at').order('created_at', { ascending: false });
    const { data: businesses } = await supabase.from('businesses').select('profile_id, business_name, verification_status');
    const { data: creators } = await supabase.from('creators').select('profile_id, channel_name, verification_status');

    const merged = profiles?.map(p => {
        const business = businesses?.find(b => b.profile_id === p.id);
        const creator = creators?.find(c => c.profile_id === p.id);
        
        return {
            ...p,
            display_name: business?.business_name || creator?.channel_name || p.email,
            verification_status: business?.verification_status || creator?.verification_status || 'N/A',
            type: business ? 'BUSINESS' : (creator ? 'CREATOR' : 'USER'),
            role: p.role || 'USER' // Using the native 'role' column from profiles
        };
    }) || [];

    setUsers(merged);
    setLoading(false);
  }

  async function handleAction(action: 'BAN' | 'UNBAN' | 'VERIFY' | 'PROMOTE') {
    if (!selectedUser) return;
    setProcessing(true);
    const uid = selectedUser.id;

    try {
        if (action === 'BAN') {
            const { error } = await supabase.rpc('ban_user_completely', { target_user_id: uid });
            if (error) throw error;
        }

        if (action === 'UNBAN') {
            const { error } = await supabase.rpc('unban_user', { target_user_id: uid });
            if (error) throw error;
        }

        if (action === 'VERIFY') {
            if (selectedUser.type === 'BUSINESS') await supabase.from('businesses').update({ verification_status: 'APPROVED' }).eq('profile_id', uid);
            if (selectedUser.type === 'CREATOR') await supabase.from('creators').update({ verification_status: 'APPROVED' }).eq('profile_id', uid);
        }

        if (action === 'PROMOTE') {
            await supabase.from('profiles').update({ role: 'SUPER_ADMIN' }).eq('id', uid);
        }

        // AUDIT LOG LOGIC
        await supabase.rpc('log_admin_action', { 
            p_action: `USER_${action}`, 
            p_resource: 'users',
            p_target_id: uid, 
            p_details: { target_email: selectedUser.email } 
        });

        alert(`User ${action} Successful`);
        setSelectedUser(null);
        fetchUsers(); 

    } catch (err: any) {
        alert("Error: " + err.message);
    }
    setProcessing(false);
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP COMMAND BAR */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Command</h1>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest tracking-tighter">Security // Permissions</p>
                </div>
            </div>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-8 bg-slate-900 border-slate-800 text-white focus:ring-blue-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>

        {/* IDENTITY LIST */}
        <div className="grid gap-4">
            {filteredUsers.map((user) => (
                <Card key={user.id} className={`bg-slate-900 border transition-all ${user.verification_status === 'BANNED' ? 'border-red-900/50 opacity-75' : 'border-slate-800 hover:border-slate-700'}`}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border ${
                                user.role === 'SUPER_ADMIN' ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                                {user.display_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                    {user.display_name}
                                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && <Badge className="bg-blue-600 hover:bg-blue-600">GOD MODE</Badge>}
                                </h3>
                                <p className="text-sm text-slate-500 font-mono tracking-tight">{user.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 uppercase">{user.type}</Badge>
                                    <Badge 
                                        className={`text-[10px] uppercase ${
                                            user.verification_status === 'APPROVED' ? 'bg-green-900/50 text-green-400' : 
                                            user.verification_status === 'BANNED' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'
                                        }`}
                                    >
                                        {user.verification_status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setSelectedUser(user)}>
                                    <UserCog size={16} className="mr-2"/> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle>Manage User: {user.display_name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 gap-4 py-4">
                                    <Button 
                                        className="bg-green-600 hover:bg-green-700 justify-start"
                                        onClick={() => handleAction('VERIFY')}
                                        disabled={processing}
                                    >
                                        <CheckCircle2 size={18} className="mr-2"/> Force Verify (Approve)
                                    </Button>
                                    <Button 
                                        className="bg-blue-600 hover:bg-blue-700 justify-start"
                                        onClick={() => handleAction('PROMOTE')}
                                        disabled={user.role === 'SUPER_ADMIN' || processing}
                                    >
                                        <Shield size={18} className="mr-2"/> Promote to Super Admin
                                    </Button>
                                    
                                    {user.verification_status === 'BANNED' ? (
                                        <Button 
                                            variant="secondary" 
                                            className="justify-start bg-blue-900 hover:bg-blue-800 text-white"
                                            onClick={() => handleAction('UNBAN')}
                                            disabled={processing}
                                        >
                                            <Unlock size={18} className="mr-2"/> UNBAN USER (Restore Access)
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="destructive" 
                                            className="justify-start"
                                            onClick={() => handleAction('BAN')}
                                            disabled={user.role === 'SUPER_ADMIN' || processing}
                                        >
                                            <XCircle size={18} className="mr-2"/> BAN USER (Kill Switch)
                                        </Button>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}