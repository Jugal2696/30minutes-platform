"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Plus, Edit, Trash2, ArrowLeft, Eye, Globe } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CMSPageList() {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<any[]>([]);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    const { data } = await supabase
      .from('cms_pages')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) setPages(data);
    setLoading(false);
  }

  async function createPage() {
    const slug = prompt("Enter URL Slug (e.g. 'about-us' or 'landing-v1'):");
    if (!slug) return;

    const { data, error } = await supabase.from('cms_pages').insert({
        title: 'Untitled Page',
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        status: 'DRAFT',
        content: {}
    }).select().single();

    if (error) alert("Error: " + error.message);
    else window.location.href = `/admin/cms/pages/${data.id}`;
  }

  async function deletePage(id: string) {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    await supabase.from('cms_pages').delete().eq('id', id);
    fetchPages();
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin'}>
                    <ArrowLeft size={20} className="mr-2"/> OS
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">CMS Pages</h1>
                    <p className="text-slate-400">Manage website content and landing pages.</p>
                </div>
            </div>
            <Button onClick={createPage} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus size={16} className="mr-2"/> Create Page
            </Button>
        </div>

        {/* PAGE LIST */}
        <div className="grid gap-4">
            {pages.length === 0 && <div className="text-slate-500 italic">No pages found. Create one to get started.</div>}
            {pages.map((page) => (
                <Card key={page.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-800 rounded flex items-center justify-center text-slate-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {page.title}
                                    <Badge variant={page.status === 'PUBLISHED' ? 'default' : 'secondary'}>{page.status}</Badge>
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-1">
                                    <span className="flex items-center gap-1"><Globe size={12}/> /{page.slug}</span>
                                    <span>Updated: {new Date(page.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:text-white" onClick={() => window.open(`/${page.slug}?preview=true`, '_blank')}>
                                <Eye size={16}/>
                            </Button>
                            <Button size="sm" className="bg-slate-800 text-white hover:bg-slate-700" onClick={() => window.location.href=`/admin/cms/pages/${page.id}`}>
                                <Edit size={16} className="mr-2"/> Editor
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deletePage(page.id)}>
                                <Trash2 size={16}/>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

      </div>
    </div>
  );
}