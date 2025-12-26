"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save, ArrowLeft, Menu, Columns, Link as LinkIcon } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NavigationBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [navItems, setNavItems] = useState<any[]>([]);
  const [footerItems, setFooterItems] = useState<any[]>([]);
  const [availablePages, setAvailablePages] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    // 1. RBAC Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    // --- FIX: TYPE SAFE RBAC CHECK ---
    const { data: roleData } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id).single();
    const roleName = (roleData as any)?.roles?.name || ((roleData as any)?.roles?.[0]?.name);

    if (roleName !== 'SUPER_ADMIN') {
        window.location.href = '/admin';
        return;
    }

    // 2. Fetch Data
    const { data: nav } = await supabase.from('cms_navigation').select('*').order('order_index', { ascending: true });
    if (nav) setNavItems(nav);

    const { data: footer } = await supabase.from('cms_footer_links').select('*').order('order_index', { ascending: true });
    if (footer) setFooterItems(footer);
    
    // 3. Fetch CMS Pages for Selector
    const { data: pages } = await supabase.from('cms_pages').select('id, title, slug').eq('status', 'PUBLISHED');
    if (pages) setAvailablePages(pages);

    setLoading(false);
  }

  // --- HEADER LOGIC ---
  function addNavItem() {
    setNavItems([...navItems, { isNew: true, label: '', url: '', page_id: null, order_index: navItems.length, is_visible: true }]);
  }

  function updateNavItem(index: number, field: string, value: any) {
    const newItems = [...navItems];
    
    if (field === 'page_select') {
        // ID Linking Logic
        if (value === '') {
            newItems[index].page_id = null;
        } else {
            const page = availablePages.find(p => p.id === value);
            if (page) {
                newItems[index].page_id = page.id;
                newItems[index].label = newItems[index].label || page.title;
                newItems[index].url = `/${page.slug}`; // Fallback URL for UI display
            }
        }
    } else {
        newItems[index] = { ...newItems[index], [field]: value };
    }
    setNavItems(newItems);
  }

  function removeNavItem(index: number) {
    const item = navItems[index];
    if (!item.isNew && confirm("Delete link?")) {
        supabase.from('cms_navigation').delete().eq('id', item.id).then(init);
    } else {
        const newItems = [...navItems];
        newItems.splice(index, 1);
        setNavItems(newItems);
    }
  }

  // --- FOOTER LOGIC ---
  function addFooterItem() {
    setFooterItems([...footerItems, { isNew: true, column_title: 'Links', label: '', url: '', page_id: null, order_index: footerItems.length, is_visible: true }]);
  }

  function updateFooterItem(index: number, field: string, value: any) {
    const newItems = [...footerItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFooterItems(newItems);
  }

  function removeFooterItem(index: number) {
     const item = footerItems[index];
     if (!item.isNew && confirm("Delete link?")) {
        supabase.from('cms_footer_links').delete().eq('id', item.id).then(init);
     } else {
         const newItems = [...footerItems];
         newItems.splice(index, 1);
         setFooterItems(newItems);
     }
  }

  // --- SAVE & FLUSH CACHE ---
  async function handleSave() {
    setSaving(true);

    // Prepare Upserts (Remove 'isNew' flag and 'page_select' if present)
    const headerUpserts = navItems.map(({ isNew, page_select, ...item }) => item);
    const footerUpserts = footerItems.map(({ isNew, ...item }) => item);

    if (headerUpserts.length > 0) await supabase.from('cms_navigation').upsert(headerUpserts);
    if (footerUpserts.length > 0) await supabase.from('cms_footer_links').upsert(footerUpserts);

    // Call Revalidate API
    try {
        await fetch('/api/revalidate', {
            method: 'POST',
            body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY })
        });
    } catch (e) {
        console.error("Cache purge failed", e);
    }

    setSaving(false);
    alert("Published! Frontend cache cleared.");
    init();
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Navigation Builder</h1>
                    <p className="text-slate-400">Header & Footer Management.</p>
                </div>
            </div>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                {saving ? <Loader2 className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>} Publish & Clear Cache
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* HEADER */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800 pb-4">
                    <CardTitle className="text-white flex items-center gap-2"><Menu size={18}/> Header Menu</CardTitle>
                    <Button size="sm" variant="secondary" onClick={addNavItem} className="bg-slate-800 text-slate-200"><Plus size={14}/></Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {navItems.map((item, idx) => (
                        <div key={idx} className={`bg-slate-950 p-2 rounded border space-y-2 ${item.is_visible ? 'border-slate-800' : 'border-red-900/50 opacity-75'}`}>
                            <div className="flex gap-2 items-center">
                                <Input 
                                    placeholder="Label" 
                                    className="h-8 bg-slate-900 border-slate-700 text-white text-sm flex-1"
                                    value={item.label}
                                    onChange={e => updateNavItem(idx, 'label', e.target.value)}
                                />
                                <div className="flex items-center gap-2" title="Toggle Visibility">
                                    <Switch 
                                        checked={item.is_visible} 
                                        onCheckedChange={(checked) => updateNavItem(idx, 'is_visible', checked)} 
                                    />
                                </div>
                                <Input 
                                    type="number"
                                    className="h-8 w-14 bg-slate-900 border-slate-700 text-white text-center"
                                    value={item.order_index}
                                    onChange={e => updateNavItem(idx, 'order_index', parseInt(e.target.value))}
                                />
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-red-500" onClick={() => removeNavItem(idx)}><Trash2 size={14}/></Button>
                            </div>
                            <div className="flex gap-2 items-center">
                                <LinkIcon size={12} className="text-slate-500"/>
                                <select 
                                    className="h-6 bg-slate-900 border border-slate-700 text-white text-xs rounded px-1 flex-1"
                                    value={item.page_id || ''}
                                    onChange={e => updateNavItem(idx, 'page_select', e.target.value)}
                                >
                                    <option value="">Select CMS Page (Robust)</option>
                                    {availablePages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                                <span className="text-xs text-slate-500">OR</span>
                                <Input 
                                    placeholder="/custom-url" 
                                    className="h-6 bg-transparent border-b border-slate-700 text-slate-400 text-xs p-0 flex-1 rounded-none focus-visible:ring-0"
                                    value={item.url}
                                    onChange={e => updateNavItem(idx, 'url', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* FOOTER */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800 pb-4">
                    <CardTitle className="text-white flex items-center gap-2"><Columns size={18}/> Footer Links</CardTitle>
                    <Button size="sm" variant="secondary" onClick={addFooterItem} className="bg-slate-800 text-slate-200"><Plus size={14}/></Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {footerItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-slate-950 p-2 rounded border border-slate-800">
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center gap-2">
                                    <Input 
                                        placeholder="Column" 
                                        className="h-8 bg-slate-900 border-slate-700 text-blue-400 font-bold text-xs w-1/3"
                                        value={item.column_title}
                                        onChange={e => updateFooterItem(idx, 'column_title', e.target.value)}
                                    />
                                    <Switch 
                                        checked={item.is_visible} 
                                        onCheckedChange={(checked) => updateFooterItem(idx, 'is_visible', checked)} 
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Label" 
                                        className="h-8 bg-slate-900 border-slate-700 text-white text-sm"
                                        value={item.label}
                                        onChange={e => updateFooterItem(idx, 'label', e.target.value)}
                                    />
                                    <Input 
                                        placeholder="URL" 
                                        className="h-8 bg-slate-900 border-slate-700 text-slate-400 text-sm"
                                        value={item.url}
                                        onChange={e => updateFooterItem(idx, 'url', e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-500 mt-1" onClick={() => removeFooterItem(idx)}>
                                <Trash2 size={16}/>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}