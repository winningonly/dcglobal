"use client";
import React, { useState } from "react";

export default function DownloadZipButton({ id, rows }: { id?: string; rows: Record<string, string>[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const bodyPayload = id ? { id } : { rows };
      const res = await fetch("/api/issue/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificates${id ? `-${id}` : ""}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Download failed";
      setError(message);
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