"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlatformLogo({ className }: { className?: string }) {
  const [config, setConfig] = useState({
    name: '30Minutes', // Default Fallback
    logo: ''
  });

  useEffect(() => {
    async function fetchIdentity() {
      const { data } = await supabase.from('platform_settings').select('site_name, logo_url').single();
      if (data) {
        setConfig({
          name: data.site_name || '30Minutes',
          logo: data.logo_url || ''
        });
      }
    }
    fetchIdentity();
  }, []);

  if (config.logo) {
    return (
      <img 
        src={config.logo} 
        alt={config.name} 
        className={`h-8 w-auto object-contain ${className}`} 
      />
    );
  }

  return (
    <span className={`font-black tracking-tight text-xl ${className}`}>
      {config.name}
    </span>
  );
}