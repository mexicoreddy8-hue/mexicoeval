"use client";
import { useState, useEffect, useCallback } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import Drawer from "@/components/Drawer";
import { useToast } from "@/components/Toast";
import { SUPABASE_READY } from "@/lib/supabase";
import { listLocations, createLocation, updateLocation } from "@/lib/db";
import type { Location } from "@/lib/types";

const COLORS = ["#2563EB", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48", "#0ea5e9"];

export default function Locations() {
  const toast = useToast();
  const [rows, setRows] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<Partial<Location>>({ color: COLORS[0] });

  const reload = useCallback(async () => {
    if (!SUPABASE_READY) return;
    try { setRows(await listLocations()); } catch { /* */ }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function save() {
    if (!form.name || !form.code) { toast("Site name and code required", "alert-triangle"); return; }
    if (form.color && rows.some((r) => r.color === form.color && r.id !== editing?.id)) {
      toast("This color is already used by another location", "alert-triangle");
      return;
    }
    if (SUPABASE_READY) {
      try {
        if (editing) {
          await updateLocation(editing.id, form);
          toast("Location updated");
        } else {
          await createLocation(form);
          toast("Location added");
        }
        await reload();
      }
      catch { toast("Could not save", "alert-triangle"); }
    } else { toast("Connect Supabase to save", "info"); }
    setOpen(false); setEditing(null); setForm({ color: COLORS[0] });
  }
  const openNew = () => { setEditing(null); setForm({ color: COLORS[0] }); setOpen(true); };
  const openEdit = (location: Location) => { setEditing(location); setForm(location); setOpen(true); };

  return (
    <Shell portal="admin" title="Locations" sub="Evaluation sites across the program">
      <div className="card">
        <div className="card-head">
          <div><h3>Evaluation Sites</h3><div className="sub">Each site has a unique code & color used in reports and the tracker</div></div>
          <button className="btn btn-pri" onClick={openNew}><Icon name="plus" size={16} /> Add Location</button>
        </div>
        <div className="card-pad" style={{ padding: rows.length ? 0 : undefined }}>
          {rows.length === 0 ? (
            <EmptyState icon="map-pin" title="No locations yet"
              text="Add the sites where evaluations take place. Students are tied to a location."
              action={<button className="btn btn-pri" onClick={openNew}><Icon name="plus" size={16} /> Add Location</button>} />
          ) : (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Site Name</th><th>Location Code</th><th></th></tr></thead>
              <tbody>{rows.map((l) => (
                <tr key={l.id}>
                  <td><b>{l.name}</b></td>
                  <td><span className="pill" style={{ background: `${l.color}1a`, color: l.color }}><span className="sdot" style={{ background: l.color }} /> {l.code}</span></td>
                  <td><button className="btn btn-icon btn-xs btn-ghost" onClick={() => openEdit(l)}><Icon name="pencil" size={14} /></button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>

      <Drawer open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Edit Location" : "Add Location"} sub="Sites identify where evaluations happen"
        footer={<><button className="btn btn-ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button><button className="btn btn-pri" onClick={save}>Save Location</button></>}>
        <div className="field"><label>Site Name</label><input className="input" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Campus" /></div>
        <div className="field"><label>Site Code</label><input className="input" value={form.code || ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. SITE-01" /></div>
        <div className="field"><label>Color</label>
          <div style={{ display: "flex", gap: 10 }}>
            {COLORS.map((c) => {
              const used = rows.some((r) => r.color === c && r.id !== editing?.id);
              return (
              <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                disabled={used}
                title={used ? "Already used" : "Use this color"}
                style={{ width: 34, height: 34, borderRadius: 10, background: c, opacity: used ? 0.32 : 1, border: form.color === c ? "3px solid #0F1B3D" : "2px solid #fff", boxShadow: "0 0 0 1px var(--line)", cursor: used ? "not-allowed" : "pointer" }} />
            )})}
          </div>
        </div>
        <div className="hint-box"><Icon name="info" size={16} /> The code and color identify this location in reports, chats, and the evaluation tracker.</div>
      </Drawer>
    </Shell>
  );
}
