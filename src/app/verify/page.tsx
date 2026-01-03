"use client";
import { useState } from "react";

export default function VerifyPage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.found) {
          setResult(`Certificate found: ${data.type || ""} — ${data.count} trainee${data.count === 1 ? "" : "s"}`);
        } else {
          setResult("No certificate found for that ID");
        }
      } else {
        setResult(data?.error || "Verification failed");
      }
    } catch (err: any) {
      setResult(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#3c0ea6] mb-4">Verify Your Certificate</h1>
        <p className="text-gray-400 mb-6">Enter your ID to check if you have a certificate</p>
        <form onSubmit={(e) => handleVerify(e)} className="flex flex-col items-center gap-4">
          <input
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-[#3c0ea6] text-black placeholder-gray-400"
            placeholder="Enter your ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <button
            type="submit"
            disabled={!id || loading}
            className={`px-6 py-3 rounded ${!id || loading ? "bg-gray-400 text-white/90" : "bg-green-600 text-white"}`}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
        {result && <p className="mt-4 text-sm text-gray-700">{result}</p>}
      </div>
    </div>
  );
}