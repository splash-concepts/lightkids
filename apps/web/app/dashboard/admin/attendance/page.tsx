"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../../page.css";
import "../../mentor/mentor.css";

export default function HistoricAttendance() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/attendance?page=${page}&limit=100`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecords(data);
        } else if (data && Array.isArray(data.data)) {
          setRecords(data.data);
          setTotalPages(data.totalPages || 1);
        } else {
          setRecords([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setRecords([]);
        setLoading(false);
      });
  }, [page]);

  return (
    <div className="mentor-container" style={{ minHeight: '100vh' }}>
      <div className="orb orb-1"></div>
      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <Link href="/dashboard/admin" className="btn btn-outline btn-sm">← Back</Link>
          <h1 className="logo-text" style={{ marginLeft: '1rem' }}>Historic <span className="gradient-text">Attendance</span></h1>
        </div>
      </header>

      <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h2>Attendance Log</h2>
          <p className="text-secondary" style={{ marginBottom: '2rem' }}>Review all historic daily attendance markings across all classes.</p>

          {loading ? <p>Loading records...</p> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Child Name</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Marked By</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Notes/Reason</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>No attendance records found.</td></tr>
                ) : records.map(record => (
                  <tr key={record._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>{new Date(record.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{record.childId?.name || 'Unknown Child'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge`} style={{ 
                        background: record.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: record.status === 'PRESENT' ? 'var(--secondary)' : 'var(--danger)',
                        padding: '0.2rem 0.5rem', borderRadius: '4px'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem' }}>{record.markedBy?.name || 'Unknown Mentor'}</td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{record.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
