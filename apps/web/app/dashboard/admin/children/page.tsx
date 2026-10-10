"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "../../../../components/Modal";
import "../../../page.css";
import "../../mentor/mentor.css";

export default function ChildrenDirectory() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionResult, setActionResult] = useState<{isOpen: boolean; type: 'success' | 'error'; title: string; message: string} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);

  const fetchChildren = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/children?page=${page}&limit=50`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChildren(data);
        } else if (data && Array.isArray(data.data)) {
          setChildren(data.data);
          setTotalPages(data.totalPages || 1);
        } else {
          setChildren([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchChildren();
  }, [page]);

  const performDeleteChild = async (childId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/children/${childId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete child");
      }
      
      setActionResult({ isOpen: true, type: 'success', title: "Child Archived", message: "Child deleted and moved to archive successfully!" });
      fetchChildren();
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: "Delete Failed", message: err.message });
    }
  };

  const handleDeleteChild = (childId: string) => {
    setConfirmAction({
      isOpen: true,
      title: "Archive Child?",
      message: "Are you sure you want to delete this child? Their record and attendance history will be moved to the Archives.",
      onConfirm: () => performDeleteChild(childId)
    });
  };

  return (
    <div className="mentor-container" style={{ minHeight: '100vh' }}>
      <div className="orb orb-1"></div>

      {/* Action Modals */}
      {actionResult && (
        <Modal 
          isOpen={actionResult.isOpen} 
          type={actionResult.type} 
          title={actionResult.title} 
          onConfirm={() => setActionResult(null)}
          onClose={() => setActionResult(null)}
        >
          <p>{actionResult.message}</p>
        </Modal>
      )}

      {confirmAction && (
        <Modal 
          isOpen={confirmAction.isOpen} 
          type="confirm" 
          title={confirmAction.title} 
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onClose={() => setConfirmAction(null)}
          confirmText="Yes, Archive"
        >
          <p>{confirmAction.message}</p>
        </Modal>
      )}

      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <Link href="/dashboard/admin" className="btn btn-outline btn-sm">← Back</Link>
          <h1 className="logo-text" style={{ marginLeft: '1rem' }}>Children <span className="gradient-text">Directory</span></h1>
        </div>
      </header>

      <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>All Registered Children</h2>
          <p className="text-secondary" style={{ marginBottom: '2rem' }}>A complete list of children and their basic info.</p>

          {loading ? <p>Loading children...</p> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {children.length === 0 ? <p>No children found.</p> : children.map(child => (
                <div key={child._id} className="action-card glass-panel hover-lift" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{child.name}</h3>
                    <span className="badge" style={{ background: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      {child.classCategoryId?.name || 'Unassigned'}
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>Handoff Code: <strong>{child.uniqueCode}</strong></p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                    Parents: {child.parentIds?.map((p: any) => p.name).join(', ') || 'N/A'}
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/children/${child._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>Full Profile</Link>
                    <button 
                      onClick={() => handleDeleteChild(child._id)} 
                      className="btn btn-outline btn-sm" 
                      style={{ padding: '0.4rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
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
