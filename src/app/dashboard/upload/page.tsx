"use client";
import { useState, Suspense } from "react";  // Added Suspense here
import { useSearchParams, useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "dli-basic";
  const name = searchParams.get("name") || "User";

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titleMap: Record<string, string> = {
    "dli-basic": "Dominion Leadership Institute (DLI) Basic\nUpload List of Participants/Trainees",
    "dli-advanced": "Dominion Leadership Institute (DLI) Advanced\nUpload List of Participants/Trainees",
    "discipleship": "Discipleship Institute\nUpload List of Participants/Trainees",
  };

  const selectedText = titleMap[type] || titleMap["dli-basic"];

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      return;
    }

    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are allowed");
      setFile(null);
      return;
    }

    setFile(f);
  };

  // Simple CSV parser supporting commas and quoted fields
  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return [];

    function parseLine(line: string) {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          out.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur.trim());
      return out;
    }

    const headers = parseLine(lines[0]).map((h) => h.trim());
    const rows = lines.slice(1).map((l) => {
      const fields = parseLine(l);
      const obj: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = fields[i] ?? "";
      }
      return obj;
    });

    return rows;
  }

  async function handleNext() {
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, data: parsed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      const id = json.id;
      router.push(`/dashboard/upload/review?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-[#3c0ea6] text-white flex flex-col">
      <header className="flex justify-end p-8">
        <nav className="space-x-8">
          <Link href="/" className="text-white hover:text-white/80 transition">Home</Link>
          <Link href="/dashboard" className="text-white hover:text-white/80 transition">Back</Link>
        </nav>
      </header>

      <h1 className="text-5xl font-bold text-[#ffffff] mb-12 text-center">DC Certificate Portal</h1>

      <main className="flex-1 flex items-center justify-center px-8 pb-20">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl px-16 py-12 text-center text-[#3c0ea6]">
          <h2 className="text-4xl font-extrabold mb-4">Upload the Trainees' CSV List</h2>
          <p className="text-2xl text-gray-600 mb-8">What Certificate would you like to Process today?</p>

          <div className="flex items-center gap-8 mb-8 justify-center flex-wrap">
            <div className="bg-[#3c0ea6] text-white rounded-xl px-8 py-8 min-w-[360px] text-center whitespace-pre-line">
              {selectedText}
            </div>

            <label className="inline-flex flex-col items-center justify-center border-2 border-dashed border-[#c7c7ef] rounded-lg px-8 py-8 min-w-[260px] text-[#6b21a8] bg-white/20 cursor-pointer">
              <span className="text-lg font-medium">Click here to upload the CSV</span>
              <span className="text-xs text-gray-500 mt-2">Only allowed format: .CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFiles} />
            </label>
          </div>

          <div className="flex items-center justify-center">
            <button onClick={handleNext} disabled={!file} className={`${file ? "bg-[#3c0ea6] text-white" : "bg-gray-400 text-white/90"} px-6 py-3 rounded-md`}>Next</button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <p className="text-[#3c0ea6] text-xl font-medium mt-8">Select an option above and proceed to upload the Trainees' .CSV file</p>
        </div>
      </main>

      <div className="mt-4">
        <Link href="/dashboard" className="text-sm text-[#3c0ea6]">Back to dashboard</Link>
      </div>

      <footer className="p-8 text-center">
        <Link href="/" className="text-white text-lg hover:text-white/80 transition">Logout</Link>
      </footer>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#3c0ea6] flex items-center justify-center"><p className="text-white text-2xl">Loading...</p></div>}>
      <UploadContent />
    </Suspense>
  );
}