import { supabase } from "../supabase/client";

export const validarCredenciales = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return data.user;
};

export const cerrarSesion = async () => {
  await supabase.auth.signOut();
};
