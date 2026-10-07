"use client";

import { useState } from "react";
import Link from "next/link";
import "./handoff.css";

export default function HandoffPage() {
  const [code, setCode] = useState("");
  const [siblings, setSiblings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/handoff/verify/${code}`, {
        headers: { `Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error("Invalid code or no children found");
      const data = await response.json();
      setSiblings(data);
      setStep(2);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (childId: string, type: "DROP_OFF" | "PICK_UP") => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/handoff`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ childId, type, code }),
      });
      if (!response.ok) throw new Error("Handoff failed");
      setMessage(`Successfully logged ${type} for child.`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="handoff-container">
      <div className="bg-shape shape-1"></div>
      
      <div className="handoff-card glass-panel animate-fade-in" style={{ maxWidth: step === 2 ? '600px' : '480px' }}>
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div className="handoff-header">
          <h2>Secure Handoff</h2>
          <p>{step === 1 ? "Verify identity via the unique 6-digit code." : "Select children for handoff."}</p>
        </div>

        {message && <div className="alert-message">{message}</div>}

        {step === 1 ? (
          <form className="handoff-form" onSubmit={handleVerify}>
            <div className="input-group">
              <label>6-Digit Unique Code</label>
              <input 
                type="text" 
                maxLength={6} 
                required 
                className="code-input"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        ) : (
          <div className="siblings-list">
            {siblings.map((child: any) => (
              <div key={child._id} className="sibling-item" style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{child.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{child.classCategoryId?.name || 'Class Assigned'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleAction(child._id, "DROP_OFF")} className="btn btn-primary btn-sm" disabled={loading}>Drop Off</button>
                  <button onClick={() => handleAction(child._id, "PICK_UP")} className="btn btn-outline btn-sm" disabled={loading}>Pick Up</button>
                </div>
              </div>
            ))}
            <button onClick={() => setStep(1)} className="btn btn-outline w-full" style={{ marginTop: '1rem' }}>Enter Another Code</button>
          </div>
        )}
      </div>
    </div>
  );
}
