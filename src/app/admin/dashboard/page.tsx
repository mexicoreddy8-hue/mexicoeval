"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import { listLocations } from "@/lib/db";
import type { Location } from "@/lib/types";

const BASE_STATS = [
  { ic: "graduation-cap", tint: "tint-blue", lbl: "Total Students", val: 0 },
  { ic: "clipboard-check", tint: "tint-green", lbl: "Evaluations Done", val: 0 },
  { ic: "stethoscope", tint: "tint-violet", lbl: "Total Evaluators", val: 0 },
  { ic: "map-pin", tint: "tint-teal", lbl: "Locations", val: "locations" },
];

export default function Dashboard() {
  const [site, setSite] = useState("all");
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    listLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  const hasLocations = locations.length > 0;
  const stats = BASE_STATS.map((s) => ({
    ...s,
    val: s.val === "locations" ? locations.length : s.val,
  }));

  return (
    <Shell portal="admin" title="Dashboard" sub="Evaluation activity across all locations">
      {/* Site filter — only shown once locations exist */}
      <div className="between wrap" style={{ marginBottom: 20 }}>
        {hasLocations ? (
          <div className="tabs">
            <button className={`tab ${site === "all" ? "active" : ""}`} onClick={() => setSite("all")}>
              All Sites
            </button>
            {locations.map((l) => (
              <button key={l.id} className={`tab ${site === l.id ? "active" : ""}`} onClick={() => setSite(l.id)}>
                {l.name}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}
        <span className="pill pill-blue">
          <Icon name="map-pin" size={14} /> {hasLocations ? `${locations.length} active site${locations.length > 1 ? "s" : ""}` : "No active sites yet"}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        {stats.map((s) => (
          <div className="stat" key={s.lbl}>
            <div className={`ic ${s.tint}`}><Icon name={s.ic} size={24} /></div>
            <div className="lbl">{s.lbl}</div>
            <div className="val">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Group Evaluation Tracker */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div><h3>Evaluation Tracker</h3><div className="sub">Live · each site keeps its own scheduled groups</div></div>
        </div>
        <div className="card-pad">
          <EmptyState icon="activity" title="No evaluation groups yet"
            text="Once assessment groups are scheduled, live progress for each site will appear here." />
        </div>
      </div>

      {/* Chart placeholders */}
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-head"><div><h3>Evaluation Activity</h3><div className="sub">Daily submissions last week</div></div></div>
          <div className="card-pad"><EmptyState icon="trending-up" title="No activity yet" text="Submission trends will plot here as evaluations come in." /></div>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Completion by Case</h3></div></div>
          <div className="card-pad"><EmptyState icon="pie-chart" title="No data" /></div>
        </div>
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><div><h3>Group Status by Site</h3></div></div>
          <div className="card-pad"><EmptyState icon="chart-column" title="No groups yet" /></div>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Top Evaluators</h3></div></div>
          <div className="card-pad"><EmptyState icon="award" title="No evaluations yet" /></div>
        </div>
      </div>
    </Shell>
  );
}
