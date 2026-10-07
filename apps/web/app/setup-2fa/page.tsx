"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./setup-2fa.css";

export default function Setup2FA() {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // In a real app, you would pass the userId from context or JWT decoding
    const fetchQrCode = async () => {
      try {
        const response = await fetch("${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/2fa/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "mock-mentor-id" }), // Replace with actual userId
        });
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
      } catch (err) {
        console.error("Failed to fetch QR code", err);
      }
    };
    fetchQrCode();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/2fa/turn-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "mock-mentor-id", token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invalid token");
      
      alert("2FA Setup Complete! Redirecting to Dashboard...");
      window.location.href = "/dashboard/mentor";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="bg-shape shape-1"></div>
      <div className="setup-card glass-panel animate-fade-in">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div className="setup-header">
          <div className="lock-icon">🔒</div>
          <h2>Secure Your Account</h2>
          <p>Set up Two-Factor Authentication (2FA) for extra security.</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <div className="qr-section">
          <p className="step-text"><strong>Step 1:</strong> Scan this QR code with Google Authenticator or Authy.</p>
          <div className="qr-code-box">
            {qrCodeUrl ? <img src={qrCodeUrl} alt="2FA QR Code" /> : <div className="qr-skeleton">Loading...</div>}
          </div>
        </div>

        <form className="verify-form" onSubmit={handleVerify}>
          <p className="step-text"><strong>Step 2:</strong> Enter the 6-digit code from your app.</p>
          <input 
            type="text" 
            placeholder="000000" 
            maxLength={6} 
            required 
            className="token-input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Enable 2FA"}
          </button>
        </form>
      </div>
    </div>
  );
}
