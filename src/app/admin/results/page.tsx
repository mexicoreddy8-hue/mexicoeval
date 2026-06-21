"use client";
import { useState, useEffect, useCallback } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { SUPABASE_READY } from "@/lib/supabase";
import { listGroups, listLocations, listStudents } from "@/lib/db";
import type { Group, Location, Student } from "@/lib/types";

export default function Results() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [active, setActive] = useState<Group | null>(null);
  const [site, setSite] = useState("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    if (!SUPABASE_READY) return;
    try {
      const [nextGroups, nextLocations, nextStudents] = await Promise.all([
        listGroups(),
        listLocations(),
        listStudents(),
      ]);
      setGroups(nextGroups);
      setLocations(nextLocations);
      setStudents(nextStudents);
      setSite((current) => current === "all" || nextLocations.some((l) => l.name === current) ? current : "all");
    } catch { /* */ }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  function toggle(id: string) {
    setChecked((c) => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exportCsv() {
    const selected = groups.filter((g) => checked.size === 0 || checked.has(g.id));
    if (selected.length === 0) { toast("No groups to export", "alert-triangle"); return; }
    const headers = ["Assessment Date", ...locations.map((l) => l.name), "Total"];
    const lines = [
      headers,
      ...selected.map((g) => [
        g.assessment_date,
        ...locations.map((l) => String(countStudents(g.id, l.name))),
        String(countStudents(g.id)),
      ]),
    ];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluahealth-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded ${selected.length} group report${selected.length > 1 ? "s" : ""}`);
  }

  const hasLocations = locations.length > 0;
  const countStudents = (groupId: string, locationName?: string) =>
    students.filter((s) => s.group_id === groupId && (!locationName || s.site === locationName)).length;

  return (
    <Shell portal="admin" title="Reports" sub="Submission tracking by assessment date">
      {!active ? (
        <div className="card">
          <div className="card-head">
            <div><h3>Assessment Groups</h3><div className="sub">Select groups to export. Reports show evaluator panels & timestamps — no scores.</div></div>
            <button className="btn btn-pri" onClick={exportCsv}><Icon name="download" size={16} /> Export Reports</button>
          </div>
          <div className="card-pad" style={{ padding: groups.length ? 0 : undefined }}>
            {groups.length === 0 ? (
              <EmptyState icon="chart-column" title="No reports yet"
                text="Once evaluations are submitted, results appear here grouped by assessment date." />
            ) : (
              <div className="tbl-wrap"><table className="tbl tbl-clickable tbl-reports">
                <thead><tr><th style={{ width: 36 }}></th><th>Assessment Date</th>{hasLocations ? locations.map((l) => <th key={l.id}>{l.name}</th>) : <th>Locations</th>}<th style={{ textAlign: "center" }}>Total</th></tr></thead>
                <tbody>{groups.map((g) => (
                  <tr key={g.id} onClick={() => setActive(g)}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" className="row-chk" checked={checked.has(g.id)} onChange={() => toggle(g.id)} /></td>
                    <td><b>{g.assessment_date}</b></td>
                    {hasLocations ? locations.map((l) => <td key={l.id}>{countStudents(g.id, l.name)}</td>) : <td>No locations added</td>}
                    <td style={{ textAlign: "center" }}>{countStudents(g.id)}</td>
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
              {locations.map((l) => <button key={l.id} className={`tab ${site === l.name ? "active" : ""}`} onClick={() => setSite(l.name)}>{l.name}</button>)}
            </div>
          </div>
          <div className="card"><div className="card-pad">
            <EmptyState icon="clipboard-check" title="No submissions yet"
              text="Each case will show a panel of evaluators and their submission timestamps once they finish." />
          </div></div>
        </>
      )}
    </Shell>
  );
}
