"use client";
import React, { useState } from "react";

export default function DownloadZipButton({ id, filename }: { id: string; filename: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/issue/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleDownload} className="bg-green-600 text-white px-6 py-3 rounded" disabled={loading}>
        {loading ? "Preparing..." : "Download Zipped File of Certificates"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
