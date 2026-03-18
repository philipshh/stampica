import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadPosterFile(
  blob: Blob,
  path: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from('poster-orders')
    .upload(path, blob, { upsert: true, contentType: blob.type });

  if (error) throw error;

  const { data } = supabase.storage.from('poster-orders').getPublicUrl(path);
  return data.publicUrl;
}
