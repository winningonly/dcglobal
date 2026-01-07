import fs from "fs/promises";
import path from "path";
import Link from "next/link";

type Row = Record<string, string>;

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; name?: string }>;
}) {
  const params = await searchParams;
  const id = params?.id;
  const name = params?.name || "User";

  if (!id) {
    return (
      <div className="min-h-screen bg-[#3c0ea6] text-white flex items-center justify-center p-8">
        <div className="w-full max-w-3xl bg-white rounded-3xl p-10 text-[#3c0ea6] text-center">
          <h1 className="text-3xl font-bold">No upload found</h1>
          <p className="mt-4">No upload id provided.</p>
          <div className="mt-8">
            <Link href="/dashboard" className="text-sm text-[#3c0ea6]">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const UPLOADS_DIR = path.join(process.cwd(), "db", "uploads");
  const filePath = path.join(UPLOADS_DIR, `${id}.json`);
  let record: { data: Row[]; type?: string } | null = null;
  try {
    const txt = await fs.readFile(filePath, "utf8");
    record = JSON.parse(txt);
  } catch (err) {
    record = null;
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-[#3c0ea6] text-white flex items-center justify-center p-8">
        <div className="w-full max-w-3xl bg-white rounded-3xl p-10 text-[#3c0ea6] text-center">
          <h1 className="text-3xl font-bold">Upload not found</h1>
          <p className="mt-4">We couldn't find the uploaded data.</p>
          <div className="mt-8">
            <Link href="/dashboard" className="text-sm text-[#3c0ea6]">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const data = record.data || [];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="min-h-screen bg-[#3c0ea6] text-white flex flex-col">
      <header className="flex justify-end p-8">
        <nav className="space-x-8">
          <Link href="/" className="text-white hover:text-white/80 transition">Home</Link>
          <Link href="/dashboard" className="text-white hover:text-white/80 transition">Dashboard</Link>
        </nav>
      </header>

      <h1 className="text-5xl font-bold text-[#ffffff] mb-12 text-center">Review Uploaded Trainee CSV List</h1>

      <main className="flex-1 flex items-center justify-center px-8 pb-20">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl px-6 py-8 text-center text-[#3c0ea6]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-gray-500 border-b">
                  {columns.map((c) => (
                    <th key={c} className="px-6 py-4">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="text-gray-700 border-b">
                    {columns.map((c) => (
                      <td key={c} className="px-6 py-4">{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-[#3c0ea6]">Please Check for Errors before proceeding to Print / Issue Certificates to all Participants</p>

          <div className="mt-6">
            <Link
              href={`/dashboard/upload/issue?id=${id}&name=${encodeURIComponent(name)}&type=${encodeURIComponent(record.type || '')}`}
              className="inline-block bg-green-600 text-white px-6 py-3 rounded"
            >
              Proceed to Issue Certificate
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center">
        <Link href="/" className="text-white text-lg hover:text-white/80 transition">Logout</Link>
      </footer>
    </div>
  );
}