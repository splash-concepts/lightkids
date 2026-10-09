"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "../../page.css";

export default function UserProfile() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [mentorClasses, setMentorClasses] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load user profile");
        return res.json();
      })
      .then(data => {
        setData(data);
        if (data.classes) {
           setMentorClasses(data.classes.map((c: any) => c._id));
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    try {
      const payload = JSON.parse(atob(token.split('.')[1] as string));
      setCurrentUser(payload);
      if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories`, {
          headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (Array.isArray(data)) setAllClasses(data);
        }).catch(console.error);
      }
    } catch (e) { console.error(e); }
  }, [id]);

  const handleSaveAssignedClasses = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${id}/classes`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ classIds: mentorClasses })
      });
      if (!res.ok) throw new Error("Failed to assign classes");
      
      // Reload profile
      const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const profData = await profRes.json();
      setData(profData);
      setIsAssigning(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Loading Profile...</div></div>;
  if (error) return <div className="home-container"><div style={{padding: '3rem', color: 'var(--danger)'}}>{error}</div></div>;
  if (!data || !data.user) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>User not found.</div></div>;

  const { user, children, classes } = data;

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="dashboard-content">
        <button onClick={() => window.history.back()} className="btn btn-outline btn-sm" style={{ marginBottom: '2rem' }}>← Back</button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '2rem' }}>
                {user.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{user.name}</h1>
                <div>
                  <span className="badge" style={{ background: 'var(--accent)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-block', marginRight: '0.5rem' }}>
                    {user.role}
                  </span>
                  {user.office && (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-block', border: '1px solid var(--border-color)' }}>
                      {user.office}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>Email</p>
                <p style={{ fontSize: '1.1rem' }}>{user.email}</p>
              </div>
              {user.phoneNumber && (
                <div>
                  <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>Phone</p>
                  <p style={{ fontSize: '1.1rem' }}>{user.phoneNumber}</p>
                </div>
              )}
              {user.whatsappNumber && (
                <div>
                  <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>WhatsApp</p>
                  <p style={{ fontSize: '1.1rem' }}>
                    <a href={`https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>{user.whatsappNumber}</a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {user.role === 'PARENT' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Children Profiles</h2>
              {children?.length === 0 ? (
                <p className="text-secondary">No children linked to this parent.</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                  {children.map((child: any) => (
                    <Link href={`/children/${child._id}`} key={child._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } } as any}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>{child.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{child.classCategoryId?.name || 'Assigned Class'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === 'MENTOR' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>Assigned Classes</h2>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && !isAssigning && (
                  <button onClick={() => setIsAssigning(true)} className="btn btn-primary btn-sm">Assign Classes</button>
                )}
              </div>
              
              {isAssigning ? (
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                    {allClasses.map(cls => (
                      <label key={cls._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={mentorClasses.includes(cls._id)}
                          onChange={(e) => {
                            if (e.target.checked) setMentorClasses([...mentorClasses, cls._id]);
                            else setMentorClasses(mentorClasses.filter(id => id !== cls._id));
                          }}
                        />
                        {cls.name}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleSaveAssignedClasses} className="btn btn-primary btn-sm" disabled={updating}>
                      {updating ? "Saving..." : "Save Assignments"}
                    </button>
                    <button onClick={() => setIsAssigning(false)} className="btn btn-outline btn-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {classes?.length === 0 ? (
                    <p className="text-secondary">No classes assigned to this mentor.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                      {classes.map((cls: any) => (
                        <div key={cls._id} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>{cls.name}</h3>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ages {cls.ageMin}-{cls.ageMax}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
