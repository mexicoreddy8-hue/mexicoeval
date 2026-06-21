"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import { listStudents } from "@/lib/db";
import type { Student } from "@/lib/types";

const CASES = ["Escenario A - Via aerea", "Escenario B - Politrauma", "Escenario C - RCP avanzada"];

interface Q { n: number; title: string; type: "rubric" | "yesno" | "comment"; opts?: { ttl: string; ds: string }[] }
const RUBRIC_OPTS = [
  { ttl: "Insuficiente", ds: "No cumple con los criterios minimos esperados." },
  { ttl: "Aceptable", ds: "Cumple parcialmente con los criterios esperados." },
  { ttl: "Competente", ds: "Cumple satisfactoriamente con los criterios esperados." },
  { ttl: "Sobresaliente", ds: "Supera ampliamente los criterios esperados." },
];
const QUESTIONS: Q[] = [
  { n: 1, title: "Valoracion inicial de la via aerea", type: "rubric", opts: RUBRIC_OPTS },
  { n: 2, title: "Solicito equipo de aspiracion antes de intervenir?", type: "yesno" },
  { n: 3, title: "Tecnica de apertura de via aerea", type: "rubric", opts: RUBRIC_OPTS },
  { n: 4, title: "Verifico la efectividad de la ventilacion?", type: "yesno" },
  { n: 5, title: "Comunicacion con el equipo", type: "rubric", opts: RUBRIC_OPTS },
  { n: 6, title: "Observaciones del evaluador", type: "comment" },
];

export default function Evaluate() {
  const toast = useToast();
  const { profile } = useAuth();
  const [caseSel, setCaseSel] = useState("");
  const [studentSel, setStudentSel] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    listStudents()
      .then((rows) => setStudents(profile?.site ? rows.filter((s) => s.site === profile.site) : rows))
      .catch(() => setStudents([]));
  }, [profile?.site]);

  const required = QUESTIONS.filter((q) => q.type !== "comment");
  const answered = required.filter((q) => answers[q.n]).length;
  const pct = Math.round((answered / required.length) * 100);
  const circ = 2 * Math.PI * 54;
  const ringColor = pct === 100 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#2563EB";
  const selectedStudent = students.find((s) => s.id === studentSel);

  return (
    <Shell portal="evaluator" title="Evaluate" sub="Select a student to begin a case assessment">
      {students.length === 0 ? (
        <div className="card"><div className="card-pad">
          <EmptyState icon="clipboard-list" title="No students to evaluate yet"
            text="When students are imported for your assigned site, they will appear here." />
        </div></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-pad">
              <div className="field-row">
                <div className="field">
                  <label>Select a student</label>
                  <select className="select" value={studentSel} onChange={(e) => { setStudentSel(e.target.value); setAnswers({}); }}>
                    <option value="" disabled>Select a student...</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name} - {s.qrtexto} - {s.slot || "No slot"}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Select a case</label>
                  <select className="select" value={caseSel} onChange={(e) => { setCaseSel(e.target.value); setAnswers({}); }}>
                    <option value="" disabled>Select a case...</option>
                    {CASES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {!studentSel || !caseSel ? (
            <div className="card"><div className="card-pad"><div className="empty-sm">Select a student and case above to begin the evaluation.</div></div></div>
          ) : (
            <>
              <div className="eval-progress">
                <div className="eval-progress-circle">
                  <svg className="ring-prog" viewBox="0 0 120 120">
                    <circle className="ring-bg" cx="60" cy="60" r="54" />
                    <circle className="ring-fg" cx="60" cy="60" r="54" style={{ stroke: ringColor, strokeDasharray: circ, strokeDashoffset: circ - (circ * pct) / 100 }} />
                    <text className="ring-count" x="60" y="58">{answered}/{required.length}</text>
                    <text className="ring-sub" x="60" y="74">Answered</text>
                  </svg>
                  <div><div style={{ fontWeight: 800 }}>{selectedStudent?.name} - {caseSel}</div><div className="sub">{pct}% complete</div></div>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                {QUESTIONS.map((q) => (
                  <div className="q-card" key={q.n}>
                    <div className="q-head"><span className="qn">{q.n}. {q.title}</span>{q.type !== "comment" ? <span className="q-req">Required</span> : <span className="tiny muted" style={{ marginLeft: 6, color: "var(--muted)", fontSize: 12 }}>Optional</span>}</div>
                    <div className="q-body">
                      {q.type === "rubric" && q.opts?.map((o) => (
                        <div key={o.ttl} className={`opt-pick ${answers[q.n] === o.ttl ? "sel" : ""}`} onClick={() => setAnswers((a) => ({ ...a, [q.n]: o.ttl }))}>
                          <span className="radio" /><div><div className="ttl">{o.ttl}</div><div className="ds">{o.ds}</div></div>
                        </div>
                      ))}
                      {q.type === "yesno" && (
                        <div className="q-yn">
                          {["Si", "No"].map((v) => <div key={v} className={`yn ${answers[q.n] === v ? "on" : ""}`} onClick={() => setAnswers((a) => ({ ...a, [q.n]: v }))}>{v}</div>)}
                        </div>
                      )}
                      {q.type === "comment" && <textarea className="input" rows={3} placeholder="Notes and recommendations for the student..." />}
                    </div>
                  </div>
                ))}
                <div className="eval-submit-bar" style={{ justifyContent: "center" }}>
                  <button className="btn btn-pri" type="button" onClick={() => toast("Evaluation submitted")}><Icon name="send" size={16} /> Submit Evaluation</button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </Shell>
  );
}
