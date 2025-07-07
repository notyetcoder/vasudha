
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadProfileImage(file: File, userId: string): Promise<string | null> {
  const filePath = `${userId}/${file.name}`;

  const { error } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Upload failed:', error.message);
    return null;
  }

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
