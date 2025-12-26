import { createClient } from '@supabase/supabase-js';

// Server-side check only
export async function checkFlag(flagKey: string, userId?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: flag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', flagKey)
    .single();

  if (!flag) return false; // Fail safe

  // 1. Global Check
  if (flag.is_enabled_globally) return true;

  // 2. User/Role Check (If user ID provided)
  if (userId && flag.allowed_roles && flag.allowed_roles.length > 0) {
     // Fetch user role (Assuming you have a helper or query for this)
     const { data: roleData } = await supabase.from('user_roles').select('roles(name)').eq('user_id', userId).single();
     const roleName = (roleData as any)?.roles?.name;
     
     if (flag.allowed_roles.includes(roleName)) return true;
  }

  return false;
}