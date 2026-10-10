"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "../../../../components/Modal";
import "../../../page.css"; // Reuse dashboard styles

export default function AdminClassesDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [newClass, setNewClass] = useState({ name: "", description: "", ageMin: 1, ageMax: 3 });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string; mentorIds: string[]; ageMin: number; ageMax: number }>({ name: "", description: "", mentorIds: [], ageMin: 0, ageMax: 0 });
  const [updating, setUpdating] = useState(false);

  const [actionResult, setActionResult] = useState<{isOpen: boolean; type: 'success' | 'error'; title: string; message: string} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);

  const fetchClasses = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data);

      const mentorsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users?role=MENTOR`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        setMentors(Array.isArray(mentorsData) ? mentorsData : (mentorsData.data || []));
      }
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
    if (creating) return;
    setCreating(true);
    setError("");
    setSuccess("");
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
      setNewClass({ name: "", description: "", ageMin: 1, ageMax: 3 });
      setActionResult({ isOpen: true, type: 'success', title: 'Class Created', message: 'Class category created successfully!' });
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: 'Failed to Create Class', message: err.message });
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (cls: any) => {
    setEditingId(cls._id);
    setEditForm({ 
      name: cls.name, 
      description: cls.description || "", 
      mentorIds: cls.mentorIds?.map((m: any) => m._id || m) || [],
      ageMin: cls.ageMin || 0,
      ageMax: cls.ageMax || 0
    });
  };

  const handleMentorToggle = (mentorId: string) => {
    setEditForm(prev => {
      const isAssigned = prev.mentorIds.includes(mentorId);
      if (isAssigned) return { ...prev, mentorIds: prev.mentorIds.filter(id => id !== mentorId) };
      return { ...prev, mentorIds: [...prev.mentorIds, mentorId] };
    });
  };

  const handleUpdateClass = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (updating) return;
    setUpdating(true);
    setError("");
    setSuccess("");
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
      setActionResult({ isOpen: true, type: 'success', title: 'Class Updated', message: 'Class category updated successfully!' });
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: 'Failed to Update Class', message: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const performDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete class category");
      
      await fetchClasses(token as string);
      setActionResult({ isOpen: true, type: 'success', title: 'Class Deleted', message: 'Class category deleted successfully!' });
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: 'Failed to Delete Class', message: err.message });
    }
  };

  const handleDeleteClass = (id: string) => {
    setConfirmAction({
      isOpen: true,
      title: "Delete Class?",
      message: "Are you sure you want to delete this class? Children in this class will become Unassigned.",
      onConfirm: () => performDelete(id)
    });
  };

  if (loading) {
    return (
      <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ height: '40px', width: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}></div>
          <div style={{ height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div style={{ height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>
            <div style={{ height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="orb orb-1"></div>
      
      <div className="dashboard-content">
        <Link href="/dashboard/admin" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-block' }}>← Back to Admin Dashboard</Link>
        
        <header className="header glass-panel" style={{ marginBottom: '2rem', padding: '2rem', position: 'relative' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Class Categories</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage the age groups and classes for your branch.</p>
        </header>

        {/* Animated Popups */}
        {error && (
          <div className="animate-fade-in" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: 'var(--danger)', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <strong>Oops! Failed: </strong> {error}
          </div>
        )}
        
        {success && (
          <div className="animate-fade-in" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: 'var(--secondary)', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <strong>Success! </strong> {success}
          </div>
        )}

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
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Min Age (Years)</label>
                  <input 
                    type="number" 
                    value={newClass.ageMin} 
                    onChange={e => setNewClass({...newClass, ageMin: parseInt(e.target.value) || 0})} 
                    required 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Max Age (Years)</label>
                  <input 
                    type="number" 
                    value={newClass.ageMax} 
                    onChange={e => setNewClass({...newClass, ageMax: parseInt(e.target.value) || 0})} 
                    required 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>
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
                        {cls.mentorIds && cls.mentorIds.length > 0 && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <strong>Assigned Mentors: </strong>
                            {cls.mentorIds.map((m: any) => m.name).join(", ")}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                        <button onClick={() => startEditing(cls)} className="btn btn-outline btn-sm">Edit & Assign</button>
                        <button onClick={() => handleDeleteClass(cls._id)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete</button>
                      </div>
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
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Min Age</label>
                            <input 
                              type="number" 
                              value={editForm.ageMin} 
                              onChange={e => setEditForm({...editForm, ageMin: parseInt(e.target.value) || 0})} 
                              required 
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'white' }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Age</label>
                            <input 
                              type="number" 
                              value={editForm.ageMax} 
                              onChange={e => setEditForm({...editForm, ageMax: parseInt(e.target.value) || 0})} 
                              required 
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'white' }}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Assign Mentors</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {mentors.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No mentors available.</p> : mentors.map(mentor => (
                              <label key={mentor._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={editForm.mentorIds.includes(mentor._id)}
                                  onChange={() => handleMentorToggle(mentor._id)}
                                />
                                {mentor.name}
                              </label>
                            ))}
                          </div>
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
