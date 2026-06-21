"use client";
import { useState, useEffect, useCallback } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import Drawer from "@/components/Drawer";
import DateField from "@/components/DateField";
import FileDrop from "@/components/FileDrop";
import { useToast } from "@/components/Toast";
import { SUPABASE_READY } from "@/lib/supabase";
import { listGroups, listLocations, listStudents, createGroup, createStudent } from "@/lib/db";
import type { Group, Location, Student } from "@/lib/types";
import { parseStudentSheet } from "@/lib/importSheet";

const SLOTS = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM"];

export default function Students() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [active, setActive] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [site, setSite] = useState("all");

  const [dGroup, setDGroup] = useState(false);
  const [dAdd, setDAdd] = useState(false);
  const [dImport, setDImport] = useState(false);

  const [gDate, setGDate] = useState("");
  const [gErr, setGErr] = useState("");
  const [form, setForm] = useState<Partial<Student>>({ site: "", slot: "10:00 AM" });

  const reload = useCallback(async () => {
    if (!SUPABASE_READY) return;
    try {
      const [nextGroups, nextLocations] = await Promise.all([listGroups(), listLocations()]);
      setGroups(nextGroups);
      setLocations(nextLocations);
      setSite((current) => current === "all" || nextLocations.some((l) => l.name === current) ? current : "all");
      setForm((current) => ({
        ...current,
        site: current.site && nextLocations.some((l) => l.name === current.site) ? current.site : nextLocations[0]?.name || "",
      }));
    } catch { /* */ }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function openGroup(g: Group) {
    setActive(g);
    if (SUPABASE_READY) { try { setStudents(await listStudents(g.id)); } catch { setStudents([]); } }
  }

  async function saveGroup() {
    if (!gDate) { setGErr("Please select an assessment date."); return; }
    setGErr("");
    if (SUPABASE_READY) {
      try { await createGroup({ assessment_date: gDate, description: "" }); await reload(); toast("Group created"); }
      catch { toast("Could not save — check Supabase", "alert-triangle"); }
    } else { toast("Connect Supabase to save", "info"); }
    setDGroup(false); setGDate(""); setGErr("");
  }

  async function saveStudent() {
    if (!form.name || !active) { toast("Name required", "alert-triangle"); return; }
    if (locations.length === 0) { toast("Add a location before registering students", "alert-triangle"); return; }
    if (!form.site) { toast("Select a location", "alert-triangle"); return; }
    if (SUPABASE_READY) {
      try { await createStudent({ ...form, group_id: active.id }); setStudents(await listStudents(active.id)); toast("Student registered"); }
      catch { toast("Could not save", "alert-triangle"); }
    } else { toast("Connect Supabase to save", "info"); }
    setDAdd(false); setForm({ site: locations[0]?.name || "", slot: "10:00 AM" });
  }

  async function onImport(file: File) {
    if (locations.length === 0) { toast("Add a location before importing students", "alert-triangle"); return; }
    try {
      const rows = await parseStudentSheet(file);
      toast(`Parsed ${rows.length} rows`);
      const siteNames = new Set(locations.map((l) => l.name));
      const invalid = rows.find((r) => r.site && !siteNames.has(r.site));
      if (invalid) { toast(`Unknown location: ${invalid.site}`, "alert-triangle"); return; }
      if (SUPABASE_READY && active) {
        for (const r of rows) {
          await createStudent({
            group_id: active.id,
            name: r.name,
            qrtexto: r.qrtexto,
            site: r.site || locations[0].name,
            slot: r.slot || "10:00 AM",
            photo_url: r.photo_url || null,
            idcard_url: r.idcard_url || null,
          });
        }
        setStudents(await listStudents(active.id));
      }
      setDImport(false);
    } catch { toast("Could not parse file", "alert-triangle"); }
  }

  const filtered = site === "all" ? students : students.filter((s) => s.site === site);
  const hasLocations = locations.length > 0;
  const studentCounts = groups.reduce<Record<string, Record<string, number>>>((acc, g) => {
    acc[g.id] = {};
    return acc;
  }, {});
  if (active) {
    studentCounts[active.id] = students.reduce<Record<string, number>>((acc, s) => {
      if (s.site) acc[s.site] = (acc[s.site] || 0) + 1;
      return acc;
    }, {});
  }
  const openAddStudent = () => {
    if (!hasLocations) { toast("Add a location before registering students", "alert-triangle"); return; }
    setForm((current) => ({ ...current, site: current.site || locations[0].name, slot: current.slot || "10:00 AM" }));
    setDAdd(true);
  };
  const openImport = () => {
    if (!hasLocations) { toast("Add a location before importing students", "alert-triangle"); return; }
    setDImport(true);
  };
  const showIdCard = (student: Student) => {
    if (!student.idcard_url) {
      toast("No ID card uploaded for this student", "alert-triangle");
      return;
    }
    window.open(student.idcard_url, "_blank", "noopener,noreferrer");
  };

  return (
    <Shell portal="admin" title="Students" sub="Assessment groups, organized by date">
      {!active ? (
        <div className="card">
          <div className="card-head">
            <div><h3>Assessment Groups</h3><div className="sub">Each group is identified by its assessment date</div></div>
            <button className="btn btn-pri" onClick={() => setDGroup(true)}><Icon name="plus" size={16} /> New Group</button>
          </div>
          <div className="card-pad" style={{ padding: groups.length ? 0 : undefined }}>
            {groups.length === 0 ? (
              <EmptyState icon="calendar" title="No assessment groups yet"
                text="Create an assessment group (by date), then add or import students into it."
                action={<button className="btn btn-pri" onClick={() => setDGroup(true)}><Icon name="plus" size={16} /> New Group</button>} />
            ) : (
              <div className="tbl-wrap"><table className="tbl tbl-clickable">
                <thead><tr><th>Assessment Date</th><th>Locations</th><th style={{ textAlign: "center" }}>Total</th><th></th></tr></thead>
                <tbody>{groups.map((g) => (
                  <tr key={g.id} onClick={() => openGroup(g)}>
                    <td><b>{g.assessment_date}</b></td>
                    <td>{hasLocations ? locations.map((l) => l.name).join(", ") : "No locations added"}</td>
                    <td style={{ textAlign: "center" }}>{Object.values(studentCounts[g.id] || {}).reduce((a, b) => a + b, 0)}</td>
                    <td><button className="btn btn-icon btn-xs btn-ghost" onClick={(e) => { e.stopPropagation(); }}><Icon name="pencil" size={14} /></button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="group-ctx" style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setActive(null)}><Icon name="arrow-left" size={14} /> All Groups</button>
            <span className="gname">Assessment {active.assessment_date}</span>
          </div>
          <div className="card-head" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div className="tabs scroll-tabs">
              <button className={`tab ${site === "all" ? "active" : ""}`} onClick={() => setSite("all")}>All Sites</button>
              {locations.map((l) => (
                <button key={l.id} className={`tab ${site === l.name ? "active" : ""}`} onClick={() => setSite(l.name)}>{l.name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={openImport}><Icon name="upload" size={16} /> Import</button>
              <button className="btn btn-pri" onClick={openAddStudent}><Icon name="user-plus" size={16} /> Add Student</button>
            </div>
          </div>
          {!hasLocations ? (
            <div className="card"><div className="card-pad">
              <EmptyState icon="map-pin" title="Add a location first"
                text="Students can only be registered after at least one evaluation site is added in Locations." />
            </div></div>
          ) : filtered.length === 0 ? (
            <div className="card"><div className="card-pad">
              <EmptyState icon="users" title="No students in this group"
                text="Register students individually or import a spreadsheet (xlsx, xls, csv)."
                action={<button className="btn btn-pri" onClick={openAddStudent}><Icon name="user-plus" size={16} /> Add Student</button>} />
            </div></div>
          ) : (
            <div className="grid g-3">{filtered.map((s) => (
              <div className="case-tile student-tile" key={s.id}>
                <div className="st-head">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.photo_url ? <img src={s.photo_url} className="av-md" alt="" style={{ borderRadius: "50%" }} /> : <span className="av-md" style={{ borderRadius: "50%", background: "var(--brand-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", fontWeight: 800 }}>{s.name[0]}</span>}
                    <div><div className="nm">{s.name}</div><div className="sub" style={{ fontSize: 12 }}>{s.qrtexto}</div></div>
                  </div>
                </div>
                <div className="st-meta"><span className="slot-chip"><Icon name="map-pin" size={13} /> {s.site}</span><span className="slot-chip"><Icon name="clock" size={13} /> {s.slot}</span></div>
                <button className="btn btn-sm btn-ghost" style={{ marginTop: 12 }} onClick={() => showIdCard(s)}>
                  <Icon name="credit-card" size={14} /> Show ID Card
                </button>
              </div>
            ))}</div>
          )}
        </>
      )}

      {/* New Group drawer */}
      <Drawer open={dGroup} onClose={() => { setDGroup(false); setGErr(""); }} title="New Assessment Group"
        sub="Groups are identified by assessment date"
        footer={<><button className="btn btn-ghost" onClick={() => setDGroup(false)}>Cancel</button><button className="btn btn-pri" onClick={saveGroup}>Create Group</button></>}>
        <DateField label="Assessment Date" value={gDate} onChange={(v) => { setGDate(v); if (v) setGErr(""); }} error={gErr} />
        <div className="hint-box"><Icon name="info" size={16} /> A unique Group ID is generated automatically. Students within a group are organized by added locations and slots.</div>
      </Drawer>

      {/* Add student drawer */}
      <Drawer open={dAdd} onClose={() => setDAdd(false)} wide title="Register Student"
        sub={active ? `Assessment ${active.assessment_date}` : ""}
        footer={<><button className="btn btn-ghost" onClick={() => setDAdd(false)}>Cancel</button><button className="btn btn-pri" onClick={saveStudent}>Register</button></>}>
        <div className="field-row" style={{ marginBottom: 14 }}>
          <FileDrop bucket="student-photos" label="Foto" shape="circle" value={form.photo_url} onChange={(u) => setForm((f) => ({ ...f, photo_url: u }))} />
          <FileDrop bucket="student-idcards" label="ID Card" doc value={form.idcard_url} onChange={(u) => setForm((f) => ({ ...f, idcard_url: u }))} />
        </div>
        <div className="field-row">
          <div className="field"><label>Nombre</label><input className="input" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="field"><label>QRTEXTO</label><input className="input" value={form.qrtexto || ""} onChange={(e) => setForm((f) => ({ ...f, qrtexto: e.target.value }))} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Sede</label><select className="select" value={form.site || ""} onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}><option value="" disabled>Select a location...</option>{locations.map((l) => <option key={l.id}>{l.name}</option>)}</select></div>
          <div className="field"><label>Slot</label><select className="select" value={form.slot || ""} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div>
        </div>
      </Drawer>

      {/* Import drawer */}
      <Drawer open={dImport} onClose={() => setDImport(false)} title="Import Students" sub="Upload a spreadsheet (xlsx, xls, csv)">
        <div className="hint-box" style={{ marginBottom: 14 }}><Icon name="info" size={16} /> Required columns: <b>Nombre</b>, <b>QRTEXTO</b>, <b>Sede</b>, <b>Slot</b></div>
        <label className="btn btn-pri btn-block" style={{ cursor: "pointer" }}>
          <Icon name="upload" size={16} /> Choose file
          <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
        </label>
      </Drawer>
    </Shell>
  );
}
