"use client";
import React, { useState } from "react";

export default function VerifyPage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; courseName: string; date: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json?.found) {
        setResult({ name: json.name, courseName: json.courseName, date: json.date });
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Purple Header */}
      <div className="w-full bg-purple-800 py-12">
        <h1 className="text-5xl font-bold text-white text-center">DC Certificate Portal</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center px-4 -mt-12">
        <h1 className="text-5xl font-bold text-purple-800 mb-8">Verify Your Certificate</h1>
        <p className="text-xl text-gray-600 mb-12">Enter your ID to check if you have a certificate</p>

        <form onSubmit={submit} className="w-full max-w-md flex flex-col items-center">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Enter your ID"
            className="w-full px-6 py-4 text-lg text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 mb-8"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-4 text-xl font-medium text-white bg-green-500 rounded-lg shadow hover:bg-green-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Verify"}
          </button>
        </form>

        {notFound && (
          <div className="mt-8 text-xl font-semibold text-red-600">Dominion City ID not found</div>
        )}

        {error && <div className="mt-8 text-xl text-red-600">{error}</div>}

        {result && (
          <div className="mt-12 w-full max-w-2xl bg-blue-50 p-8 rounded-lg text-indigo-900">
            <h2 className="text-3xl font-bold text-purple-800 mb-6">Certificate Details</h2>
            <div className="text-xl space-y-4">
              <div><strong>Name:</strong> {result.name}</div>
              <div><strong>Course Name:</strong> {result.courseName}</div>
              <div><strong>Date:</strong> {result.date}</div>
            </div>
          </div>
        )}

        {/* Back to Dashboard Link */}
        <div className="mt-16 mb-12">
          <a
            href="/"
            className="text-xl text-purple-800 underline hover:text-purple-600 transition-colors"
          >
            Click here to return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}