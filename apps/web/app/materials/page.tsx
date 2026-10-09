"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./materials.css";

export default function MaterialsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("PARENT");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "ASSIGNMENT",
    classCategoryId: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] as string));
        setRole(payload.role);
      } catch (e) {}
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, classCategoryId: data[0]._id }));
            fetchMaterials(data[0]._id);
          } else {
            setLoading(false);
          }
        } else {
          setCategories([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
        setCategories([]);
        setLoading(false);
      });
  }, []);

  const fetchMaterials = async (classId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/materials/class/${classId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setMaterials(data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setFormData({ ...formData, classCategoryId: classId });
    fetchMaterials(classId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("classCategoryId", formData.classCategoryId);
      formDataToSend.append("file", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/materials`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      setMessage("Material uploaded successfully!");
      setFormData({ ...formData, title: "", description: "" });
      setFile(null);
      fetchMaterials(formData.classCategoryId);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="materials-container">
      <div className="bg-shape shape-3"></div>
      
      <div className="materials-layout">
        <div className="materials-header">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <h2>Academic Materials & Sermon Notes</h2>
          <p>Access and download resources for your child's class.</p>
        </div>

        <div className="materials-grid">
          {/* Upload Section for Mentors & Admins */}
          {(role === "MENTOR" || role === "ADMIN") && (
            <div className="upload-card glass-panel animate-fade-in">
              <h3>Upload New Material</h3>
              {message && <div className="alert-message">{message}</div>}
              <form onSubmit={handleSubmit} className="upload-form">
                <div className="input-group">
                  <label>Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Genesis Worksheet" />
                </div>
                <div className="input-group">
                  <label>Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="SERMON_NOTE">Sermon Note</option>
                    <option value="PROJECT">Project</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Class Category</label>
                  <select value={formData.classCategoryId} onChange={handleClassChange}>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} required />
                </div>
                <div className="input-group">
                  <label>File Attachment</label>
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Material"}
                </button>
              </form>
            </div>
          )}

          {/* Feed Section */}
          <div className="feed-card glass-panel animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Materials Feed</h3>
              {(role === "PARENT") && (
                <select value={formData.classCategoryId} onChange={handleClassChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name} Class</option>)}
                </select>
              )}
            </div>

            <div className="materials-list">
              {loading ? <p>Loading materials...</p> : materials.length === 0 ? (
                <p className="empty-state">No materials have been posted for this class yet.</p>
              ) : (
                materials.map(mat => (
                  <div key={mat._id} className="material-item glass-panel">
                    <div className="material-info">
                      <span className="badge">{mat.type.replace('_', ' ')}</span>
                      <h4>{mat.title}</h4>
                      <p>{mat.description}</p>
                      <small>Posted by {mat.authorId?.name || "Admin"} • {new Date(mat.createdAt).toLocaleDateString()}</small>
                    </div>
                    {mat.fileUrl && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => setPreviewUrl(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${mat.fileUrl}`)}
                          className="btn btn-secondary btn-sm"
                        >
                          View Document
                        </button>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${mat.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', padding: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setPreviewUrl(null)} className="btn btn-outline" style={{ background: 'white', color: 'black' }}>Close Preview</button>
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            {previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
            ) : previewUrl.toLowerCase().endsWith('.docx') || previewUrl.toLowerCase().endsWith('.doc') ? (
              <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'black' }}>
                <h3>Preview not available for this file type</h3>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: '1rem' }}>Download Instead</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
