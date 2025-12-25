"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Shield, ShieldAlert, CheckCircle2, XCircle, UserCog, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserManager() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    // 1. Fetch Profiles (Base Layer)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, last_sign_in_at')
      .order('created_at', { ascending: false });

    // 2. Fetch Business/Creator Details (Parallel)
    const { data: businesses } = await supabase.from('businesses').select('profile_id, business_name, verification_status');
    const { data: creators } = await supabase.from('creators').select('profile_id, channel_name, verification_status');

    // 3. Merge Data
    const merged = profiles?.map(p => {
        const business = businesses?.find(b => b.profile_id === p.id);
        const creator = creators?.find(c => c.profile_id === p.id);
        
        return {
            ...p,
            display_name: business?.business_name || creator?.channel_name || 'Unnamed User',
            verification_status: business?.verification_status || creator?.verification_status || 'N/A',
            type: business ? 'BRAND' : (creator ? 'CREATOR' : 'USER')
        };
    }) || [];

    setUsers(merged);
    setLoading(false);
  }

  async function handleAction(action: 'BAN' | 'VERIFY' | 'PROMOTE') {
    if (!selectedUser) return;
    const uid = selectedUser.id;

    if (action === 'BAN') {
        // We handle bans by setting status to 'BANNED' in the respective table
        if (selectedUser.type === 'BRAND') await supabase.from('businesses').update({ verification_status: 'BANNED' }).eq('profile_id', uid);
        if (selectedUser.type === 'CREATOR') await supabase.from('creators').update({ verification_status: 'BANNED' }).eq('profile_id', uid);
    }

    if (action === 'VERIFY') {
        if (selectedUser.type === 'BRAND') await supabase.from('businesses').update({ verification_status: 'APPROVED' }).eq('profile_id', uid);
        if (selectedUser.type === 'CREATOR') await supabase.from('creators').update({ verification_status: 'APPROVED' }).eq('profile_id', uid);
    }

    if (action === 'PROMOTE') {
        // Use the RBAC system we built in System 4
        // 1. Get SUPER_ADMIN role ID
        const { data: role } = await supabase.from('roles').select('id').eq('name', 'SUPER_ADMIN').single();
        if (role) {
            await supabase.from('user_roles').insert({ user_id: uid, role_id: role.id });
        }
    }

    // Audit Log
    await supabase.rpc('log_cms_action', { 
        p_action: `USER_${action}`, 
        p_page_id: uid, 
        p_details: { target_email: selectedUser.email } 
    });

    alert(`User ${action} Successful`);
    setSelectedUser(null);
    fetchUsers();
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">User Command</h1>
                    <p className="text-slate-400">Manage permissions and access.</p>
                </div>
            </div>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-8 bg-slate-900 border-slate-800 text-white"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>

        {/* USER LIST */}
        <div className="grid gap-4">
            {filteredUsers.map((user) => (
                <Card key={user.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                user.role === 'ADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-slate-800 text-slate-400'
                            }`}>
                                {user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                    {user.display_name}
                                    {user.role === 'ADMIN' && <Badge className="bg-purple-600">ADMIN</Badge>}
                                </h3>
                                <p className="text-sm text-slate-500 font-mono">{user.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">{user.type}</Badge>
                                    <Badge 
                                        className={`${
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
                            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <DialogHeader>
                                    <DialogTitle>Manage User: {user.display_name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 gap-4 py-4">
                                    <Button 
                                        className="bg-green-600 hover:bg-green-700 justify-start"
                                        onClick={() => handleAction('VERIFY')}
                                    >
                                        <CheckCircle2 size={18} className="mr-2"/> Force Verify (Approve)
                                    </Button>
                                    <Button 
                                        className="bg-purple-600 hover:bg-purple-700 justify-start"
                                        onClick={() => handleAction('PROMOTE')}
                                        disabled={user.role === 'ADMIN'}
                                    >
                                        <Shield size={18} className="mr-2"/> Promote to Admin
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        className="justify-start"
                                        onClick={() => handleAction('BAN')}
                                    >
                                        <XCircle size={18} className="mr-2"/> BAN USER (Kill Switch)
                                    </Button>
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