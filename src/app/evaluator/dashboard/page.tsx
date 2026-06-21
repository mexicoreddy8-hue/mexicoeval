"use client";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";

const STATS = [
  { ic: "clipboard-check", tint: "tint-green", lbl: "Completed Evaluations", val: 0 },
  { ic: "clock", tint: "tint-amber", lbl: "Pending Today", val: 0 },
  { ic: "layers", tint: "tint-blue", lbl: "Cases Active", val: 0 },
];

export default function EvalDashboard() {
  return (
    <Shell portal="evaluator" title="Dashboard" sub="Your evaluation workspace">
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {STATS.map((s) => (
          <div className="stat" key={s.lbl}>
            <div className={`ic ${s.tint}`}><Icon name={s.ic} size={24} /></div>
            <div className="lbl">{s.lbl}</div>
            <div className="val">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head"><div><h3>Students Evaluated per Assessment</h3><div className="sub">Semi-annual assessment history</div></div></div>
        <div className="card-pad"><EmptyState icon="chart-column" title="No history yet" text="Your evaluation totals per assessment date will plot here." /></div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Recent Evaluation Activity</h3></div></div>
        <div className="card-pad"><EmptyState icon="activity" title="No recent activity"
          text="Head to Evaluate to start assessing students." /></div>
      </div>
    </Shell>
  );
}
