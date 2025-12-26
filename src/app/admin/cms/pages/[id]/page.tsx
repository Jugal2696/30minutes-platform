"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; 
import { 
  Loader2, Save, ArrowLeft, Plus, MoveVertical, Trash, 
  Globe, Eye, Code, History, RotateCcw, Image as ImageIcon, Lock 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DynamicField = ({ field, value, onChange }: any) => {
  const label = field.label || field.name;
  
  if (field.type === 'boolean') {
     return (
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
            <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
            <Switch checked={value || false} onCheckedChange={onChange} />
        </div>
     );
  }

  if (field.type === 'image') {
      return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
            <div className="flex gap-4">
                <Input 
                    className="bg-slate-950 border-slate-800 text-white flex-1" 
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="https://..."
                />
                {value && (
                    <div className="h-10 w-10 relative bg-slate-800 rounded border border-slate-700 overflow-hidden shrink-0">
                        <img src={value} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                )}
            </div>
        </div>
      );
  }
  
  if (field.type === 'richtext' || field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
        <textarea 
          className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded p-2 text-sm min-h-[100px] font-mono"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <Input 
        className="bg-slate-950 border-slate-800 text-white" 
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

export default function CMSEditor({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  const [meta, setMeta] = useState<any>({});
  const [sections, setSections] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<any[]>([]);

  useEffect(() => {
    async function unwrap() {
       const resolvedParams = await params;
       setId(resolvedParams.id);
       init(resolvedParams.id);
    }
    unwrap();
  }, [params]);

  async function init(pageId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    
    // TYPE SAFE RBAC CHECK
    const { data: roleData } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id).single();
    const role = (roleData as any)?.roles?.name || ((roleData as any)?.roles?.[0]?.name) || 'USER';

    if (role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
        window.location.href = '/admin';
        return;
    }

    // Fetch Data
    const { data: page } = await supabase.from('cms_pages').select('*').eq('id', pageId).single();
    if (page) setMeta(page);

    const { data: sectionData } = await supabase.from('cms_sections').select('*').eq('page_id', pageId).order('order_index', { ascending: true });
    if (sectionData) setSections(sectionData);

    fetchVersions(pageId);

    const { data: blocks } = await supabase.from('cms_block_definitions').select('*').eq('is_active', true);
    if (blocks) setAvailableBlocks(blocks);

    setLoading(false);
  }

  async function fetchVersions(pageId: string) {
    const { data } = await supabase
        .from('cms_page_versions')
        .select('id, version_number, version_name, created_at')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false });
    if (data) setVersions(data);
  }

  async function handleSave(forceVersion = false) {
    setSaving(true);
    const shouldSnapshot = forceVersion || meta.status === 'PUBLISHED';

    // 1. Save Meta
    await supabase.from('cms_pages').update({
        title: meta.title,
        slug: meta.slug,
        meta_title: meta.meta_title,
        status: meta.status,
        updated_at: new Date()
    }).eq('id', id);

    // 2. Save Sections
    await supabase.from('cms_sections').delete().eq('page_id', id);
    const sectionsToInsert = sections.map((s, idx) => ({
        page_id: id,
        page_slug: meta.slug,
        section_key: s.section_key,
        title: s.title,
        content: s.content,
        order_index: idx,
        is_enabled: true
    }));
    if (sectionsToInsert.length > 0) {
        await supabase.from('cms_sections').insert(sectionsToInsert);
    }

    // 3. Snapshot
    if (shouldSnapshot) {
        const usedBlockTypes = new Set(sectionsToInsert.map(s => s.section_key));
        const schemaSnapshot = availableBlocks.filter(b => usedBlockTypes.has(b.block_type));

        await supabase.from('cms_page_versions').insert({
            page_id: id,
            meta_snapshot: meta,
            content_snapshot: sectionsToInsert,
            schema_snapshot: schemaSnapshot
        });
        
        // 4. Audit Log
        if (meta.status === 'PUBLISHED') {
             await supabase.rpc('log_cms_action', { 
                p_action: 'CMS_PUBLISH', 
                p_page_id: id, 
                p_details: { slug: meta.slug, sections: sectionsToInsert.length }
             });
        }
        
        fetchVersions(id);
    }
    
    setSaving(false);
    if (!forceVersion) alert("Saved!");
  }

  async function handleSecurePreview() {
    setGeneratingPreview(true);
    await handleSave(false); 

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); 

    await supabase.from('cms_pages').update({
        preview_token: token,
        preview_token_expires_at: expiresAt
    }).eq('id', id);

    await supabase.rpc('log_cms_action', { 
        p_action: 'CMS_PREVIEW', 
        p_page_id: id, 
        p_details: { token_expiry: expiresAt }
    });

    setGeneratingPreview(false);
    window.open(`/${meta.slug}?preview=${token}`, '_blank');
  }

  async function restoreVersion(versionId: string) {
    if (!confirm("Restore this version?")) return;
    setLoading(true);
    
    const { data: ver } = await supabase.from('cms_page_versions').select('*').eq('id', versionId).single();
    if (ver) {
        setMeta(ver.meta_snapshot);
        const frozenSchemas = ver.schema_snapshot || [];
        const restoredSections = ver.content_snapshot.map((s: any) => ({
             ...s,
             _schema: frozenSchemas.find((b: any) => b.block_type === s.section_key)?.field_schema || availableBlocks.find(b => b.block_type === s.section_key)?.field_schema
        }));
        setSections(restoredSections);

        await supabase.rpc('log_cms_action', { 
            p_action: 'CMS_RESTORE', 
            p_page_id: id, 
            p_details: { restored_version: ver.version_number }
        });
    }
    setLoading(false);
  }

  function addSection(blockType: string) {
    const blockDef = availableBlocks.find(b => b.block_type === blockType);
    setSections([...sections, {
        section_key: blockType,
        title: blockDef.friendly_name,
        content: {},
        _schema: blockDef.field_schema
    }]);
  }

  function updateSectionContent(index: number, fieldName: string, value: any) {
    const newSections = [...sections];
    newSections[index].content = { ...newSections[index].content, [fieldName]: value };
    setSections(newSections);
  }

  function moveSection(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setSections(newSections);
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT: CANVAS */}
        <div className="lg:col-span-3 space-y-6">
             <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href='/admin/cms/pages'}>
                    <ArrowLeft size={20} className="mr-2"/> Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{meta.title}</h1>
                    <div className="flex gap-2 text-xs text-slate-500">
                        <Badge variant="outline" className="text-slate-400 border-slate-700">{meta.status}</Badge>
                        <span className="flex items-center gap-1"><Code size={12}/> {sections.length} Sections</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {sections.map((section, idx) => {
                    const definition = availableBlocks.find(b => b.block_type === section.section_key);
                    const schema = section._schema || definition?.field_schema || { fields: [] };

                    return (
                        <Card key={idx} className="bg-slate-900 border-slate-800 group hover:border-slate-700 transition-all">
                            <CardHeader className="bg-slate-950/50 py-3 px-4 flex flex-row items-center justify-between border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <MoveVertical size={12} className="text-slate-600 cursor-pointer hover:text-white" onClick={() => moveSection(idx, 'up')}/>
                                        <MoveVertical size={12} className="text-slate-600 cursor-pointer hover:text-white" onClick={() => moveSection(idx, 'down')}/>
                                    </div>
                                    <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">{section.title}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-500 h-8 w-8 p-0" onClick={() => {
                                    const newS = [...sections]; newS.splice(idx, 1); setSections(newS);
                                }}>
                                    <Trash size={14}/>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 grid gap-4">
                                {schema.fields.map((field: any) => (
                                    <DynamicField 
                                        key={field.name}
                                        field={field}
                                        value={section.content[field.name]}
                                        onChange={(val: any) => updateSectionContent(idx, field.name, val)}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}

                <div className="p-6 bg-slate-900 border border-dashed border-slate-700 rounded-lg text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-4">Add Block</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {availableBlocks.map(block => (
                            <Button key={block.id} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => addSection(block.block_type)}>
                                <Plus size={14} className="mr-2"/> {block.friendly_name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: CONTROL PANEL */}
        <div className="space-y-6">
            
            <Card className="bg-slate-900 border-slate-800 sticky top-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Globe size={18}/> Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 font-bold" onClick={() => handleSave(false)} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin"/> : <Save size={16}/>} Save
                        </Button>
                         <Button variant="secondary" className="bg-blue-900 hover:bg-blue-800 text-white" onClick={() => handleSave(true)} disabled={saving} title="Create Snapshot">
                            <History size={16}/>
                        </Button>
                    </div>
                    
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300" onClick={handleSecurePreview} disabled={generatingPreview}>
                        {generatingPreview ? <Loader2 className="animate-spin mr-2"/> : <Lock size={16} className="mr-2"/>} Secure Preview
                    </Button>

                    <div className="border-t border-slate-800 pt-4 mt-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                        <select 
                            className="w-full bg-slate-950 border border-slate-800 text-white mt-1 p-2 rounded text-sm"
                            value={meta.status || 'DRAFT'}
                            onChange={(e) => setMeta({...meta, status: e.target.value})}
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><History size={18}/> Versions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                    {versions.length === 0 && <p className="text-xs text-slate-500">No history yet.</p>}
                    {versions.map((v) => (
                        <div key={v.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">v{v.version_number}</Badge>
                                    <span className="text-slate-300 font-medium text-xs">Snapshot</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">{new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString()}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => restoreVersion(v.id)}>
                                <RotateCcw size={14} className="text-blue-500"/>
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