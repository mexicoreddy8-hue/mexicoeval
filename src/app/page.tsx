"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@evaluahealth.mx");
  const [pwd, setPwd] = useState("Admin@123");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    router.prefetch("/admin/dashboard");
    router.prefetch("/evaluator/dashboard");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await signIn(email.trim(), pwd);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    router.replace(res.role === "admin" ? "/admin/dashboard" : "/evaluator/dashboard");
  }

  return (
    <div className="auth">
      <div className="auth-side">
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 48, zIndex: 3 }}>
          <h2 style={{ color: "#fff" }}>Clinical evaluation,<br />done with confidence.</h2>
          <p>Standardized rubrics, multi-evaluator panels, and live progress tracking across every assessment site.</p>
          <div className="auth-feats">
            {[
              ["shield-check", "Role-based access for admins & evaluators"],
              ["layers", "Structured cases, rubrics & batches"],
              ["chart-column", "Real-time reporting per site"],
            ].map(([ic, tx]) => (
              <div className="auth-feat" key={tx}>
                <span className="fi"><Icon name={ic} size={18} style={{ color: "#fff" }} /></span> {tx}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-card">
          <Image src="/assets/img/logo-horizontal.png" alt="EvaluaHealth Experts" width={300} height={40} className="wordmark" style={{ height: 40, width: "auto" }} priority />
          <h1>Welcome back</h1>
          <p className="lead">Sign in to your evaluation workspace.</p>
          <form onSubmit={submit}>
            <div className="field">
              <label>Email address</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <div className="pass-wrap">
                <input className="input" type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} required />
                <button type="button" onClick={() => setShow((s) => !s)}>
                  <Icon name={show ? "eye-off" : "eye"} size={18} />
                </button>
              </div>
            </div>
            {err && <div style={{ color: "#e11d48", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</div>}
            <button className="btn btn-pri btn-block" type="submit" disabled={busy} style={{ marginTop: 8 }}>
              {busy ? "Signing in…" : <>Sign In <Icon name="arrow-right" size={16} /></>}
            </button>
            <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
          </form>
          <div style={{ marginTop: 22, padding: "12px 14px", borderRadius: 10, background: "#f4f7fc", border: "1px solid #e3eaf4", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7 }}>
            <b style={{ color: "var(--ink)" }}>Demo accounts</b><br />
            Admin — <code>admin@evaluahealth.mx</code> / <code>Admin@123</code><br />
            Evaluator — <code>evaluator@evaluahealth.mx</code> / <code>Eval@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
