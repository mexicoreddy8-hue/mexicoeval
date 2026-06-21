import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: NextRequest) {
  if (!url || !anon || !service) {
    return NextResponse.json({ error: "Supabase admin environment is not configured." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing authorization." }, { status: 401 });

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Invalid authorization." }, { status: 401 });

  const { data: adminProfile } = await userClient
    .from("profiles")
    .select("role, active")
    .eq("id", authData.user.id)
    .single();
  if (adminProfile?.role !== "admin" || adminProfile.active === false) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.full_name || "").trim();
  const site = String(body.site || "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const photoUrl = body.photo_url ? String(body.photo_url).trim() : null;

  if (!email || !password || !fullName || !site) {
    return NextResponse.json({ error: "Full name, email, password, and site are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let existing = null;
  for (let page = 1; page <= 20 && !existing; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    existing = data.users.find((u) => u.email?.toLowerCase() === email) || null;
    if (data.users.length < 100) break;
  }

  const userResult = existing
    ? await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), full_name: fullName },
      })
    : await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

  if (userResult.error || !userResult.data.user) {
    return NextResponse.json({ error: userResult.error?.message || "Could not create evaluator." }, { status: 500 });
  }

  const user = userResult.data.user;
  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    email,
    role: "evaluator",
    site,
    phone,
    photo_url: photoUrl,
    active: true,
  }, { onConflict: "id" });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
