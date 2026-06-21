"use client";
import { getSupabase } from "./supabase";

export type Bucket = "student-photos" | "student-idcards" | "evaluator-photos";

/** Upload a File to a Supabase Storage bucket. Returns the public URL. */
export async function uploadFile(bucket: Bucket, file: File): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
