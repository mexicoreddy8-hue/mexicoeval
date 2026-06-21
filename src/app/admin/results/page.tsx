"use client";
import { useState, useEffect, useCallback } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { SUPABASE_READY } from "@/lib/supabase";
import { listGroups } from "@/lib/db";
import type { Group } from "@/lib/types";

const SITES = [
  { key: "all", label: "All Sites" },
  { key: "Mexico City", label: "Mexico City" },
  { key: "Guadalajara", label: "Guadalajara" },
  { key: "Monterrey", label: "Monterrey" },
];

export default function Results() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [active, setActive] = useState<Group | null>(null);
  const [site, setSite] = useState("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    if (!SUPABASE_READY) return;
    try { setGroups(await listGroups()); } catch { /* */ }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  function toggle(id: string) {
    setChecked((c) => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <Shell portal="admin" title="Reports" sub="Submission tracking by assessment date">
      {!active ? (
        <div className="card">
          <div className="card-head">
            <div><h3>Assessment Groups</h3><div className="sub">Select groups to export. Reports show evaluator panels & timestamps — no scores.</div></div>
            <button className="btn btn-pri" onClick={() => toast(checked.size ? `Exporting ${checked.size} group(s)` : "Select groups to export", checked.size ? "download" : "alert-triangle")}><Icon name="download" size={16} /> Export Reports</button>
          </div>
          <div className="card-pad" style={{ padding: groups.length ? 0 : undefined }}>
            {groups.length === 0 ? (
              <EmptyState icon="chart-column" title="No reports yet"
                text="Once evaluations are submitted, results appear here grouped by assessment date." />
            ) : (
              <div className="tbl-wrap"><table className="tbl tbl-clickable tbl-reports">
                <thead><tr><th style={{ width: 36 }}></th><th>Assessment Date</th><th>Mexico City</th><th>Guadalajara</th><th>Monterrey</th><th style={{ textAlign: "center" }}>Total</th></tr></thead>
                <tbody>{groups.map((g) => (
                  <tr key={g.id} onClick={() => setActive(g)}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" className="row-chk" checked={checked.has(g.id)} onChange={() => toggle(g.id)} /></td>
                    <td><b>{g.assessment_date}</b></td><td>0</td><td>0</td><td>0</td><td style={{ textAlign: "center" }}>0</td>
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
              {SITES.map((s) => <button key={s.key} className={`tab ${site === s.key ? "active" : ""}`} onClick={() => setSite(s.key)}>{s.label}</button>)}
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
