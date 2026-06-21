"use client";
import { getSupabase } from "./supabase";
import type {
  Location, Group, Batch, CaseRow, Question, Student, Evaluation, Profile,
} from "./types";

function sb() {
  const c = getSupabase();
  if (!c) throw new Error("Supabase not configured");
  return c;
}

const TTL = 20_000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

function clearCache(...prefixes: string[]) {
  for (const key of cache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) cache.delete(key);
  }
}

/* ---------------- Locations ---------------- */
export async function listLocations(): Promise<Location[]> {
  return cached("locations", async () => {
    const { data } = await sb().from("locations").select("*").order("code");
    return (data as Location[]) || [];
  });
}
export async function createLocation(p: Partial<Location>) {
  const { data, error } = await sb().from("locations").insert(p).select().single();
  clearCache("locations");
  if (error) throw error; return data as Location;
}
export async function updateLocation(id: string, p: Partial<Location>) {
  const { error } = await sb().from("locations").update(p).eq("id", id);
  clearCache("locations");
  if (error) throw error;
}
export async function deleteLocation(id: string) {
  const { error } = await sb().from("locations").delete().eq("id", id);
  clearCache("locations");
  if (error) throw error;
}

/* ---------------- Groups ---------------- */
export async function listGroups(): Promise<Group[]> {
  return cached("groups", async () => {
    const { data } = await sb().from("groups").select("*").order("assessment_date", { ascending: false });
    return (data as Group[]) || [];
  });
}
export async function createGroup(p: Partial<Group>) {
  const { data, error } = await sb().from("groups").insert(p).select().single();
  clearCache("groups");
  if (error) throw error; return data as Group;
}
export async function updateGroup(id: string, p: Partial<Group>) {
  const { error } = await sb().from("groups").update(p).eq("id", id);
  clearCache("groups");
  if (error) throw error;
}
export async function deleteGroup(id: string) {
  const { error } = await sb().from("groups").delete().eq("id", id);
  clearCache("groups");
  if (error) throw error;
}

/* ---------------- Batches & Cases ---------------- */
export async function listBatches(): Promise<Batch[]> {
  return cached("batches", async () => {
    const { data } = await sb().from("batches").select("*").order("assessment_date", { ascending: false });
    return (data as Batch[]) || [];
  });
}
export async function createBatch(p: Partial<Batch>) {
  const { data, error } = await sb().from("batches").insert(p).select().single();
  clearCache("batches");
  if (error) throw error; return data as Batch;
}
export async function updateBatch(id: string, p: Partial<Batch>) {
  const { error } = await sb().from("batches").update(p).eq("id", id);
  clearCache("batches");
  if (error) throw error;
}
export async function deleteBatch(id: string) {
  const { error } = await sb().from("batches").delete().eq("id", id);
  clearCache("batches");
  if (error) throw error;
}
export async function listCases(batchId?: string): Promise<CaseRow[]> {
  return cached(`cases:${batchId || "all"}`, async () => {
    let q = sb().from("cases").select("*").order("position");
    if (batchId) q = q.eq("batch_id", batchId);
    const { data } = await q;
    return (data as CaseRow[]) || [];
  });
}
export async function createCase(p: Partial<CaseRow>) {
  const { data, error } = await sb().from("cases").insert(p).select().single();
  clearCache("cases");
  if (error) throw error; return data as CaseRow;
}
export async function updateCase(id: string, p: Partial<CaseRow>) {
  const { error } = await sb().from("cases").update(p).eq("id", id);
  clearCache("cases");
  if (error) throw error;
}
export async function deleteCase(id: string) {
  const { error } = await sb().from("cases").delete().eq("id", id);
  clearCache("cases");
  if (error) throw error;
}

/* ---------------- Questions ---------------- */
export async function listQuestions(caseId: string): Promise<Question[]> {
  return cached(`questions:${caseId}`, async () => {
    const { data } = await sb().from("questions").select("*").eq("case_id", caseId).order("position");
    return (data as Question[]) || [];
  });
}
export async function createQuestion(p: Partial<Question>) {
  const { data, error } = await sb().from("questions").insert(p).select().single();
  clearCache("questions");
  if (error) throw error; return data as Question;
}
export async function updateQuestion(id: string, p: Partial<Question>) {
  const { error } = await sb().from("questions").update(p).eq("id", id);
  clearCache("questions");
  if (error) throw error;
}
export async function deleteQuestion(id: string) {
  const { error } = await sb().from("questions").delete().eq("id", id);
  clearCache("questions");
  if (error) throw error;
}

/* ---------------- Students ---------------- */
export async function listStudents(groupId?: string): Promise<Student[]> {
  return cached(`students:${groupId || "all"}`, async () => {
    let q = sb().from("students").select("*").order("created_at");
    if (groupId) q = q.eq("group_id", groupId);
    const { data } = await q;
    return (data as Student[]) || [];
  });
}
export async function createStudent(p: Partial<Student>) {
  const { data, error } = await sb().from("students").insert(p).select().single();
  clearCache("students");
  if (error) throw error; return data as Student;
}
export async function createStudents(rows: Partial<Student>[]) {
  const { data, error } = await sb().from("students").insert(rows).select();
  clearCache("students");
  if (error) throw error; return data as Student[];
}
export async function updateStudent(id: string, p: Partial<Student>) {
  const { error } = await sb().from("students").update(p).eq("id", id);
  clearCache("students");
  if (error) throw error;
}
export async function deleteStudent(id: string) {
  const { error } = await sb().from("students").delete().eq("id", id);
  clearCache("students");
  if (error) throw error;
}

/* ---------------- Evaluators (profiles) ---------------- */
export async function listEvaluators(): Promise<Profile[]> {
  return cached("profiles:evaluators", async () => {
    const { data } = await sb().from("profiles").select("*").eq("role", "evaluator").order("full_name");
    return (data as Profile[]) || [];
  });
}
export async function updateProfile(id: string, p: Partial<Profile>) {
  const { error } = await sb().from("profiles").update(p).eq("id", id);
  clearCache("profiles");
  if (error) throw error;
}

/* ---------------- Evaluations ---------------- */
export async function listEvaluations(): Promise<Evaluation[]> {
  return cached("evaluations:all", async () => {
    const { data } = await sb().from("evaluations").select("*").order("submitted_at", { ascending: false });
    return (data as Evaluation[]) || [];
  });
}
export async function listMyEvaluations(evaluatorId: string): Promise<Evaluation[]> {
  return cached(`evaluations:${evaluatorId}`, async () => {
    const { data } = await sb().from("evaluations").select("*")
      .eq("evaluator_id", evaluatorId).order("submitted_at", { ascending: false });
    return (data as Evaluation[]) || [];
  });
}
export async function createEvaluation(p: Partial<Evaluation>) {
  const { data, error } = await sb().from("evaluations").insert(p).select().single();
  clearCache("evaluations");
  if (error) throw error; return data as Evaluation;
}
export async function updateEvaluation(id: string, p: Partial<Evaluation>) {
  const { error } = await sb().from("evaluations").update(p).eq("id", id);
  clearCache("evaluations");
  if (error) throw error;
}

/* ---------------- Notifications ---------------- */
export async function listNotifications(userId: string) {
  const { data } = await sb().from("notifications").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  return data || [];
}
