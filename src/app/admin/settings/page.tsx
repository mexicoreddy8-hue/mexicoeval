"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { updateProfile } from "@/lib/db";

export default function Settings() {
  const toast = useToast();
  const { profile, refresh } = useAuth();
  const [name, setName] = useState(profile?.full_name || "Admin User");
  const [email, setEmail] = useState(profile?.email || "admin@evaluahealth.mx");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveProfile() {
    if (!profile) return;
    try {
      await updateProfile(profile.id, { full_name: name, email });
      await refresh();
      toast("Profile saved");
    } catch {
      toast("Could not save profile", "alert-triangle");
    }
  }

  async function changePassword() {
    if (password.length < 6) { toast("Password must be at least 6 characters", "alert-triangle"); return; }
    if (password !== confirm) { toast("Passwords do not match", "alert-triangle"); return; }
    setBusy(true);
    try {
      const sb = getSupabase();
      const { error } = await sb!.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast("Password updated");
    } catch {
      toast("Could not update password", "alert-triangle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell portal="admin" title="Settings" sub="Account settings">
      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><div><h3>Profile</h3><div className="sub">Your administrator account</div></div></div>
          <div className="card-pad">
            <div className="field"><label>Full Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <button className="btn btn-pri" onClick={saveProfile}><Icon name="check" size={16} /> Save Changes</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Change Password</h3><div className="sub">Update your login password</div></div></div>
          <div className="card-pad">
            <div className="field"><label>New Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="field"><label>Confirm Password</label><input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <button className="btn btn-pri" onClick={changePassword} disabled={busy}><Icon name="key-round" size={16} /> {busy ? "Updating..." : "Update Password"}</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
