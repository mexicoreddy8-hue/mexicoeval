"use client";
import { useState, useEffect, useCallback } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import Drawer from "@/components/Drawer";
import FileDrop from "@/components/FileDrop";
import { useToast } from "@/components/Toast";
import { SUPABASE_READY } from "@/lib/supabase";
import { listEvaluators, listLocations } from "@/lib/db";
import type { Profile, Location } from "@/lib/types";

export default function Evaluators() {
  const toast = useToast();
  const [rows, setRows] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [site, setSite] = useState("all");
  const [dAdd, setDAdd] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState<{ name?: string; email?: string; pass?: string; phone?: string; site?: string; photo_url?: string }>({});

  const reload = useCallback(async () => {
    listLocations().then(setLocations).catch(() => setLocations([]));
    if (!SUPABASE_READY) return;
    try { setRows(await listEvaluators()); } catch { /* */ }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const hasLocations = locations.length > 0;

  function save() {
    if (!form.name || !form.email) { toast("Name and email required", "alert-triangle"); return; }
    if (!SUPABASE_READY) { toast("Connect Supabase to invite evaluators", "info"); }
    else { toast("Evaluator account creation requires Supabase admin — wired in backend", "info"); }
    setDAdd(false); setForm({});
  }

  const filtered = site === "all" ? rows : rows.filter((r) => r.site === site);

  return (
    <Shell portal="admin" title="Evaluators" sub="Clinical evaluators by site">
      <div className="card-head" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {hasLocations ? (
          <div className="tabs scroll-tabs">
            <button className={`tab ${site === "all" ? "active" : ""}`} onClick={() => setSite("all")}>
              All Sites<span className="tab-count">{rows.length}</span>
            </button>
            {locations.map((l) => (
              <button key={l.id} className={`tab ${site === l.name ? "active" : ""}`} onClick={() => setSite(l.name)}>
                {l.name}<span className="tab-count">{rows.filter((r) => r.site === l.name).length}</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="pill pill-blue"><Icon name="map-pin" size={14} /> No active sites yet</span>
        )}
        <button className="btn btn-pri" onClick={() => setDAdd(true)}><Icon name="user-plus" size={16} /> Add Evaluator</button>
      </div>

      <div className="card"><div className="card-pad" style={{ padding: filtered.length ? 0 : undefined }}>
        {filtered.length === 0 ? (
          <EmptyState icon="stethoscope" title="No evaluators yet"
            text="Invite clinical evaluators. Each one gets login credentials and is scoped to a site."
            action={<button className="btn btn-pri" onClick={() => setDAdd(true)}><Icon name="user-plus" size={16} /> Add Evaluator</button>} />
        ) : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Evaluator</th><th>Site</th><th>Email</th><th></th></tr></thead>
            <tbody>{filtered.map((e) => (
              <tr key={e.id}>
                <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.photo_url ? <img src={e.photo_url} className="av-lg" alt="" style={{ borderRadius: "50%" }} /> : <span className="av-lg" style={{ borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{e.full_name[0]}</span>}
                  <b>{e.full_name}</b>
                </td>
                <td>{e.site}</td><td>{e.email}</td>
                <td><button className="btn btn-icon btn-xs btn-ghost"><Icon name="key-round" size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div></div>

      <Drawer open={dAdd} onClose={() => setDAdd(false)} wide title="Add Evaluator" sub="Create a clinical evaluator account"
        footer={<><button className="btn btn-ghost" onClick={() => setDAdd(false)}>Cancel</button><button className="btn btn-pri" onClick={save}>Create Account</button></>}>
        <div style={{ marginBottom: 14 }}><FileDrop bucket="evaluator-photos" label="Photo" shape="circle" value={form.photo_url} onChange={(u) => setForm((f) => ({ ...f, photo_url: u }))} /></div>
        <div className="field"><label>Full Name</label><input className="input" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dr. Maria Rodriguez" /></div>
        <div className="field"><label>Email</label><input className="input" type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        <div className="field"><label>Password</label>
          <div className="pass-wrap">
            <input className="input" type={showPass ? "text" : "password"} value={form.pass || ""} onChange={(e) => setForm((f) => ({ ...f, pass: e.target.value }))} />
            <button type="button" onClick={() => setShowPass((s) => !s)}><Icon name={showPass ? "eye-off" : "eye"} size={18} /></button>
          </div>
        </div>
        <div className="field-row">
          <div className="field"><label>Phone</label><input className="input" value={form.phone || ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div className="field"><label>Site</label><select className="select" value={form.site || ""} onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}><option value="" disabled>Select a site…</option>{locations.map((l) => <option key={l.id}>{l.name}</option>)}</select></div>
        </div>
      </Drawer>
    </Shell>
  );
}
