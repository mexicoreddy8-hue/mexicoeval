"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";

interface SubDate { date: string; count: number; editable: boolean }

export default function Submitted() {
  // Start empty (start-empty rule). Submissions appear here grouped by assessment date.
  const [dates] = useState<SubDate[]>([]);
  const [active, setActive] = useState<SubDate | null>(null);

  return (
    <Shell portal="evaluator" title="Submitted" sub="Your submitted evaluations by date">
      {!active ? (
        <div className="card">
          <div className="card-head"><div><h3>Evaluation Dates</h3><div className="sub">Only the most recent assessment date can be edited</div></div></div>
          <div className="card-pad" style={{ padding: dates.length ? 0 : undefined }}>
            {dates.length === 0 ? (
              <EmptyState icon="check-square" title="No submitted evaluations yet"
                text="Evaluations you submit will be grouped here by assessment date." />
            ) : (
              <div className="tbl-wrap"><table className="tbl tbl-clickable">
                <thead><tr><th>Evaluation Date</th><th>Number of Students Evaluated</th><th></th></tr></thead>
                <tbody>{dates.map((d, i) => (
                  <tr key={d.date} onClick={() => setActive(d)}>
                    <td><b>{d.date}</b></td>
                    <td><span className="pill pill-violet">{d.count} students</span></td>
                    <td>{i === 0 ? <span className="pill pill-green"><span className="sdot" style={{ background: "#16a34a" }} /> Editable</span> : <span className="pill pill-gray"><Icon name="lock" size={12} /> Locked</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="group-ctx" style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setActive(null)}><Icon name="arrow-left" size={14} /> All Dates</button>
            <span className="gname">{active.date}</span>
          </div>
          <div className="card"><div className="card-pad">
            <EmptyState icon="users" title="No students for this date" />
          </div></div>
        </>
      )}
    </Shell>
  );
}
