"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../../page.css"; // Reuse dashboard styles

export default function AdminClassesDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [newClass, setNewClass] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [updating, setUpdating] = useState(false);

  const fetchClasses = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchClasses(token);
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const payloadBase64 = token?.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64 as string));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...newClass,
          branchId: decodedPayload.branchId
        })
      });
      if (!res.ok) throw new Error("Failed to create class category");
      
      await fetchClasses(token as string);
      setNewClass({ name: "", description: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (cls: any) => {
    setEditingId(cls._id);
    setEditForm({ name: cls.name, description: cls.description || "" });
  };

  const handleUpdateClass = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories/${id}`, {
        method: 'PATCH',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error("Failed to update class category");
      
      await fetchClasses(token as string);
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Loading Classes...</div></div>;
  }

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="orb orb-1"></div>
      
      <div className="dashboard-content">
        <Link href="/dashboard/admin" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-block' }}>← Back to Admin Dashboard</Link>
        
        <header className="header glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Class Categories</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage the age groups and classes for your branch.</p>
        </header>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Add New Class</h3>
            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Class Name</label>
                <input 
                  type="text" 
                  value={newClass.name} 
                  onChange={e => setNewClass({...newClass, name: e.target.value})} 
                  placeholder="e.g. 0-2 Years, Teens" 
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                <input 
                  type="text" 
                  value={newClass.description} 
                  onChange={e => setNewClass({...newClass, description: e.target.value})} 
                  placeholder="e.g. Toddlers group" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Creating..." : "Create Class"}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Existing Classes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {classes.length === 0 ? (
                <p>No class categories found.</p>
              ) : (
                classes.map(cls => (
                  <div key={cls._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{cls.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{cls.description || 'No description'}</p>
                      </div>
                      <button onClick={() => startEditing(cls)} className="btn btn-outline btn-sm">Edit Alias</button>
                    </div>
                    {editingId === cls._id && (
                      <form onSubmit={(e) => handleUpdateClass(e, cls._id)} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>New Name (Alias)</label>
                          <input 
                            type="text" 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})} 
                            required 
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'white' }}
                          />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description / Age Range</label>
                          <input 
                            type="text" 
                            value={editForm.description} 
                            onChange={e => setEditForm({...editForm, description: e.target.value})} 
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'white' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>{updating ? "Saving..." : "Save"}</button>
                          <button type="button" onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
