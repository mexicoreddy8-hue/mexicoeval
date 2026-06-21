"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import Drawer from "@/components/Drawer";
import { useToast } from "@/components/Toast";
import { SUPABASE_READY } from "@/lib/supabase";
import { listGroups } from "@/lib/db";
import { RUBRIC_LEVELS, type Group, type QuestionType } from "@/lib/types";

interface DraftQ { id: string; title: string; type: QuestionType }
interface DraftCase { id: string; name: string; desc: string; questions: DraftQ[] }
interface DraftBatch { id: string; date: string; cases: DraftCase[] }

const PILLS = ["#2563EB", "#7c3aed", "#0d9488"];

export default function Cases() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [batches, setBatches] = useState<DraftBatch[]>([]);
  const [dBatch, setDBatch] = useState(false);
  const [editBatch, setEditBatch] = useState<DraftBatch | null>(null);
  const [bDate, setBDate] = useState("");
  const [bErr, setBErr] = useState("");

  const [dCase, setDCase] = useState(false);
  const [caseName, setCaseName] = useState("");
  const [caseDesc, setCaseDesc] = useState("");
  const [draftQs, setDraftQs] = useState<DraftQ[]>([]);
  const [qType, setQType] = useState<QuestionType>("rubric");
  const [qTitle, setQTitle] = useState("");

  useEffect(() => {
    if (!SUPABASE_READY) return;
    listGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const hasGroups = groups.length > 0;

  function openNewBatch() {
    if (!hasGroups) {
      toast("Create an assessment group in Students first", "alert-triangle");
      return;
    }
    setEditBatch(null); setBDate(groups[0]?.assessment_date || ""); setBErr(""); setDBatch(true);
  }
  function openBatch(b: DraftBatch) { setEditBatch(b); setBDate(b.date); setBErr(""); setDBatch(true); }

  function saveBatch() {
    if (!bDate) { setBErr("Select an assessment date from Students."); return; }
    if (!groups.some((g) => g.assessment_date === bDate)) { setBErr("This date must exist in Students first."); return; }
    if (!editBatch && batches.some((b) => b.date === bDate)) { setBErr("A case batch already exists for this date."); return; }
    setBErr("");
    if (editBatch) {
      setBatches((bs) => bs.map((b) => b.id === editBatch.id ? { ...b, date: bDate } : b).sort(byDate));
    } else {
      const nb: DraftBatch = { id: crypto.randomUUID(), date: bDate, cases: [] };
      setBatches((bs) => [...bs, nb].sort(byDate));
      setEditBatch(nb);
      toast("Batch created — add cases");
      return; // keep drawer open to add cases
    }
    setDBatch(false);
  }

  function openNewCase() {
    setCaseName(""); setCaseDesc(""); setDraftQs([]); setQTitle(""); setQType("rubric");
    setDCase(true);
  }
  function addQuestion() {
    if (!qTitle.trim()) { toast("Question title required", "alert-triangle"); return; }
    setDraftQs((q) => [...q, { id: crypto.randomUUID(), title: qTitle.trim(), type: qType }]);
    setQTitle("");
  }
  function saveCase() {
    if (!caseName.trim() || !editBatch) { toast("Case name required", "alert-triangle"); return; }
    const nc: DraftCase = { id: crypto.randomUUID(), name: caseName.trim(), desc: caseDesc, questions: draftQs };
    setBatches((bs) => bs.map((b) => b.id === editBatch.id ? { ...b, cases: [...b.cases, nc] } : b));
    setEditBatch((b) => b ? { ...b, cases: [...b.cases, nc] } : b);
    toast("Case added");
    setDCase(false);
  }

  return (
    <Shell portal="admin" title="Cases" sub="Assessment batches → cases → rubric questions">
      <div className="card">
        <div className="card-head">
          <div><h3>Case Batches</h3><div className="sub">Each batch (by date) holds the cases evaluated that day</div></div>
          <button className="btn btn-pri" onClick={openNewBatch}><Icon name="plus" size={16} /> Add Batch</button>
        </div>
        <div className="card-pad" style={{ padding: batches.length ? 0 : undefined }}>
          {!hasGroups ? (
            <EmptyState icon="calendar" title="No assessment dates yet"
              text="Create an assessment group in Students first. Case batches can only use those existing dates." />
          ) : batches.length === 0 ? (
            <EmptyState icon="layers" title="No case batches yet"
              text="Select an existing assessment date from Students, then add cases and their rubric questions."
              action={<button className="btn btn-pri" onClick={openNewBatch}><Icon name="plus" size={16} /> Add Batch</button>} />
          ) : (
            <div className="tbl-wrap"><table className="tbl tbl-clickable">
              <thead><tr><th>Assessment Date</th><th style={{ textAlign: "center" }}>Cases</th><th>Questions per Case</th><th style={{ textAlign: "center" }}>Total Questions</th><th></th></tr></thead>
              <tbody>{batches.map((b, i) => (
                <tr key={b.id} onClick={() => openBatch(b)}>
                  <td><span className="pill" style={{ background: `${PILLS[i % 3]}1a`, color: PILLS[i % 3] }}><span className="sdot" style={{ background: PILLS[i % 3] }} /> {b.date}</span></td>
                  <td style={{ textAlign: "center" }}>{b.cases.length}</td>
                  <td>{b.cases.map((c, j) => <span key={c.id}>{j > 0 && <span className="qsep"> / </span>}<span className="qchip">{c.questions.length}</span></span>)}</td>
                  <td style={{ textAlign: "center" }}><b>{b.cases.reduce((s, c) => s + c.questions.length, 0)}</b></td>
                  <td><button className="btn btn-icon btn-xs btn-ghost" onClick={(e) => { e.stopPropagation(); openBatch(b); }}><Icon name="pencil" size={14} /></button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>

      {/* Batch drawer */}
      <Drawer open={dBatch} onClose={() => { setDBatch(false); setBErr(""); }} wide
        title={editBatch ? `Assessment ${editBatch.date || ""}` : "New Case Batch"}
        sub="A batch groups the cases evaluated on one assessment date"
        footer={<><button className="btn btn-ghost" onClick={() => setDBatch(false)}>Close</button><button className="btn btn-pri" onClick={saveBatch}>{editBatch ? "Save" : "Create Batch"}</button></>}>
        <div className="field">
          <label>Assessment Date</label>
          <select className="select" value={bDate} onChange={(e) => { setBDate(e.target.value); if (e.target.value) setBErr(""); }}>
            <option value="" disabled>Select a date from Students...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.assessment_date}>{g.assessment_date}</option>
            ))}
          </select>
          {bErr && <div style={{ color: "#e11d48", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{bErr}</div>}
        </div>
        {editBatch && (
          <div style={{ marginTop: 18 }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Cases in this batch</h4>
              <button className="btn btn-sm btn-pri" onClick={openNewCase}><Icon name="plus" size={14} /> Add Case</button>
            </div>
            {editBatch.cases.length === 0 ? (
              <div className="empty-sm">No cases yet. Add one above.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {editBatch.cases.map((c, i) => (
                  <div key={c.id} className="case-tile" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 }}>
                    <div><div className="ct-name" style={{ fontSize: 14 }}>Case {String(i + 1).padStart(3, "0")} · {c.name}</div><div className="sub" style={{ fontSize: 12 }}>{c.questions.length} questions</div></div>
                    <span className="qcount-inline">{c.questions.length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Case drawer */}
      <Drawer open={dCase} onClose={() => setDCase(false)} wide title="New Case" sub="Define the case and its rubric questions"
        footer={<><button className="btn btn-ghost" onClick={() => setDCase(false)}>Cancel</button><button className="btn btn-pri" onClick={saveCase}>Save Case</button></>}>
        <div className="field"><label>Case Name</label><input className="input" value={caseName} onChange={(e) => setCaseName(e.target.value)} placeholder="Escenario B · Politrauma en urgencias" /></div>
        <div className="field"><label>Short Description</label><textarea className="input" rows={2} value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} /></div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 4 }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800 }}>Questions</h4>
          {draftQs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {draftQs.map((q, i) => (
                <div key={q.id} className="cq-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <span style={{ fontWeight: 800, color: "var(--muted)" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{q.title}</span>
                  <span className={`pill ${q.type === "rubric" ? "pill-blue" : "pill-violet"}`}>{q.type === "rubric" ? "Rubric · 4 niveles" : "Sí / No"}</span>
                  <button className="btn btn-icon btn-xs btn-ghost" onClick={() => setDraftQs((qs) => qs.filter((x) => x.id !== q.id))}><Icon name="trash-2" size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 14 }}>
            <div className="field" style={{ marginBottom: 10 }}><label>Question Title</label><input className="input" value={qTitle} onChange={(e) => setQTitle(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 12 }}><label>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className={`btn btn-sm ${qType === "rubric" ? "btn-pri" : "btn-ghost"}`} onClick={() => setQType("rubric")}>Rubric · 4 niveles</button>
                <button type="button" className={`btn btn-sm ${qType === "yesno" ? "btn-pri" : "btn-ghost"}`} onClick={() => setQType("yesno")}>Sí / No</button>
              </div>
            </div>
            {qType === "rubric" && (
              <div className="hint-box" style={{ marginTop: 0, marginBottom: 12 }}><Icon name="info" size={16} /> Levels: {RUBRIC_LEVELS.map((l) => l.level).join(" · ")}</div>
            )}
            <button className="btn btn-pri btn-block" onClick={addQuestion}><Icon name="plus" size={15} /> Add Question</button>
          </div>
        </div>
      </Drawer>
    </Shell>
  );
}

function byDate(a: { date: string }, b: { date: string }) {
  return (b.date || "").localeCompare(a.date || "");
}
