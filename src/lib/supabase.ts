import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'citizen' | 'company' | 'collector' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data.role as UserRole;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}
