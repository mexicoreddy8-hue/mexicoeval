"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";

export default function Settings() {
  const toast = useToast();
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || "Admin User");
  const [email, setEmail] = useState(profile?.email || "admin@evaluahealth.mx");

  return (
    <Shell portal="admin" title="Settings" sub="Account & program configuration">
      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><div><h3>Profile</h3><div className="sub">Your administrator account</div></div></div>
          <div className="card-pad">
            <div className="field"><label>Full Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <button className="btn btn-pri" onClick={() => toast("Profile saved")}><Icon name="check" size={16} /> Save Changes</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Program</h3><div className="sub">Evaluation defaults</div></div></div>
          <div className="card-pad">
            <div className="field"><label>Rubric Levels</label><input className="input" value="Insuficiente · Aceptable · Competente · Sobresaliente" readOnly /></div>
            <div className="field"><label>Evaluators per Case (panel)</label><input className="input" value="3" readOnly /></div>
            <div className="field"><label>Default Language</label><select className="select" defaultValue="Español"><option>Español</option><option>English</option></select></div>
            <button className="btn btn-pri" onClick={() => toast("Settings saved")}><Icon name="check" size={16} /> Save</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
