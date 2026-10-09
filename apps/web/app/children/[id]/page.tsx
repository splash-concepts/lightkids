"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "../../page.css";

export default function ChildProfile() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/children/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load child profile");
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Loading Profile...</div></div>;
  if (error) return <div className="home-container"><div style={{padding: '3rem', color: 'var(--danger)'}}>{error}</div></div>;
  if (!data || !data.child) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Child not found.</div></div>;

  const { child, attendance } = data;

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="dashboard-content">
        <button onClick={() => window.history.back()} className="btn btn-outline btn-sm" style={{ marginBottom: '2rem' }}>← Back</button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Child Details */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{child.name}</h1>
            <span className="badge" style={{ background: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
              {child.classCategoryId?.name || 'Unassigned'}
            </span>
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>DOB: {new Date(child.dob).toLocaleDateString()}</p>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>Handoff Code: <strong>{child.uniqueCode}</strong></p>
              
              {child.medicalInfo && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <h3 style={{ color: 'var(--danger)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Medical Alerts</h3>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Allergies:</strong> {child.medicalInfo.allergies || 'None recorded'}</p>
                  {child.medicalInfo.emergencyContacts?.map((ec: any, i: number) => (
                    <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Emergency Contact:</strong> {ec.name} ({ec.phone}) - {ec.relationship}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Parent Details */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Parent / Guardian</h2>
            {child.parentIds?.length === 0 ? (
              <p className="text-secondary">No parent linked to this child.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {child.parentIds?.map((parent: any) => (
                  <div key={parent._id} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{parent.name}</h3>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email: {parent.email}</p>
                    {parent.phoneNumber && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Phone: <a href={`tel:${parent.phoneNumber}`} style={{ color: 'var(--primary)' }}>{parent.phoneNumber}</a>
                      </p>
                    )}
                    {parent.whatsappNumber && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        WhatsApp: <a href={`https://wa.me/${parent.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 600 }}>{parent.whatsappNumber}</a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Recent Attendance</h2>
          {attendance?.length === 0 ? (
            <p className="text-secondary">No attendance records found.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {attendance.map((record: any) => (
                <div key={record._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <strong style={{ color: record.status === 'PRESENT' ? 'var(--secondary)' : 'var(--danger)' }}>{record.status}</strong>
                    <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                  {record.reason && <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>{record.reason}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
