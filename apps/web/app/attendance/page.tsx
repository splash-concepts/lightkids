"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./attendance.css";

export default function AttendancePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("http://localhost:3001/children/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) {
          setSelectedClass(data[0]._id);
          fetchChildren(data[0]._id);
        }
      });
  }, []);

  const fetchChildren = async (classId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/children/class/${classId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setChildren(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    fetchChildren(classId);
  };

  const markAttendance = async (childId: string, status: "PRESENT" | "ABSENT") => {
    setMessage("");
    try {
      const payload: any = { childId, status };
      if (status === "ABSENT" && reasons[childId]) {
        payload.reason = reasons[childId];
      }

      const response = await fetch("http://localhost:3001/attendance/mark", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to mark attendance");
      setMessage(`Successfully marked child as ${status}.`);
      
      // Clear reason after successful mark
      if (status === "ABSENT") {
        setReasons(prev => ({ ...prev, [childId]: "" }));
      }
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="attendance-container">
      <div className="bg-shape shape-2"></div>
      
      <div className="attendance-layout">
        <div className="attendance-header">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <h2>Class Attendance</h2>
          <p>Log daily attendance and absences for your assigned class.</p>
        </div>

        <div className="attendance-card glass-panel animate-fade-in">
          <div className="class-selector">
            <label>Select Class:</label>
            <select value={selectedClass} onChange={handleClassChange} className="class-dropdown">
              {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>

          {message && <div className="alert-message">{message}</div>}

          <div className="children-list">
            {loading ? <p>Loading class list...</p> : children.length === 0 ? (
              <p className="empty-state">No children enrolled in this class.</p>
            ) : (
              children.map(child => (
                <div key={child._id} className="child-attendance-row glass-panel">
                  <div className="child-details">
                    <h3>{child.name}</h3>
                    <p>Code: <strong>{child.uniqueCode}</strong></p>
                  </div>
                  
                  <div className="attendance-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => markAttendance(child._id, "PRESENT")}>
                      Mark Present
                    </button>
                    
                    <div className="absent-group">
                      <input 
                        type="text" 
                        placeholder="Reason for absence (optional)" 
                        value={reasons[child._id] || ""}
                        onChange={(e) => setReasons({...reasons, [child._id]: e.target.value})}
                      />
                      <button className="btn btn-outline btn-sm" onClick={() => markAttendance(child._id, "ABSENT")}>
                        Mark Absent
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
