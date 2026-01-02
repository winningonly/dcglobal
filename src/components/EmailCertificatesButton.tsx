"use client";
import React, { useState } from "react";

export default function EmailCertificatesButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/issue/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || `Server returned ${res.status}`);
      } else {
        setMessage(data?.message || "Emails queued");
      }
    } catch (err: any) {
      setMessage(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleSend} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded">
        {loading ? "Sending..." : "Email Certificates to Trainees"}
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
