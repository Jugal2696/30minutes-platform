import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Fetch Base URL from Settings
  const { data: settings } = await supabase.from('platform_settings').select('site_name').single();
  const baseUrl = 'https://30minutes.in'; // Fallback if not dynamic, or use env var

  // 2. Fetch Published Pages
  const { data: pages } = await supabase
    .from('cms_pages')
    .select('slug, updated_at')
    .eq('status', 'PUBLISHED')
    .eq('sitemap_enabled', true);

  // 3. Static Routes
  const staticRoutes = [
    '',
    '/login',
    '/onboarding/brand',
    '/onboarding/creator',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 1,
  }));

  // 4. Dynamic CMS Routes
  const cmsRoutes = (pages || []).map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...cmsRoutes];
}