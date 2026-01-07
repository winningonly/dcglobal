import fs from "fs/promises";
import path from "path";
import DownloadZipButton from "../../../../components/DownloadZipButton";
import EmailCertificatesButton from "../../../../components/EmailCertificatesButton";
import Link from "next/link";

export default async function IssuePage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; name?: string; type?: string }>;
}) {
  const params = await searchParams;
  const id = params?.id;
  const name = params?.name || "User";
  const type = params?.type || "dli-basic";

  if (!id) {
    return (
      <div className="min-h-screen bg-[#3c0ea6] text-white flex items-center justify-center p-8">
        <div className="w-full max-w-3xl bg-white rounded-3xl p-10 text-[#3c0ea6] text-center">
          <h1 className="text-3xl font-bold">Upload not found</h1>
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
  let record: { data?: Record<string, string>[]; type?: string } | null = null;
  try {
    const txt = await fs.readFile(filePath, "utf8");
    record = JSON.parse(txt);
  } catch (err: unknown) {
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
  const traineesCount = data.length;

  // try to detect location from first row using common keys
  const first = data[0] || {};
  const locKeys = ["Location", "location", "City", "city", "Venue", "venue"];
  let location = "";
  for (const k of locKeys) {
    if ((first as Record<string, string>)[k]) {
      location = (first as Record<string, string>)[k];
      break;
    }
  }

  const typeMap: Record<string, string> = {
    "dli-basic": "Dominion Leadership Institute (DLI)\nBasic",
    "dli-advanced": "Dominion Leadership Institute (DLI)\nAdvanced",
    "discipleship": "Discipleship Institute",
  };
  const displayType = typeMap[type] || typeMap["dli-basic"];

  return (
    <div className="min-h-screen bg-[#3c0ea6] text-white flex flex-col">
      <header className="flex justify-end p-8">
        <nav className="space-x-8">
          <Link href="/" className="text-white hover:text-white/80 transition">Home</Link>
          <Link href="/dashboard" className="text-white hover:text-white/80 transition">Dashboard</Link>
        </nav>
      </header>

      <h1 className="text-5xl font-bold text-[#ffffff] mb-12 text-center">DC Certificate Portal</h1>

      <main className="flex-1 flex items-center justify-center px-8 pb-20">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl px-16 py-12 text-center text-[#3c0ea6]">
          <h2 className="text-4xl font-extrabold mb-4">Send Certificate to Trainees</h2>
          <p className="text-lg text-gray-500 mb-8">Proceed to send the Certificate to the Trainees. Also find the Download Button to get the Zipped File of the Bulk Certificates.</p>

          <div className="bg-[#eef4fb] rounded-lg p-8 flex items-center justify-between gap-6">
            <div className="text-center text-[#3c0ea6] whitespace-pre-line">
              <p className="mb-2">You are about to send Certificates for</p>
              <p className="font-bold text-lg">{displayType}</p>
              <p className="mt-2">To {traineesCount} Trainee{traineesCount === 1 ? '' : 's'}{location ? ` in ${location}` : ''}</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* client-side email button */}
              <div>
                <EmailCertificatesButton id={id} rows={data} />
              </div>
              {/* client-side download button */}
              <div>
                <DownloadZipButton id={id} rows={data} />
              </div>
            </div>
          </div>

          <p className="mt-8">Thank you for using this Service. <Link href="/dashboard" className="underline text-[#3c0ea6]">Click Here to Return to Dashboard</Link></p>

        </div>
      </main>

      <footer className="p-8 text-center">
        <Link href="/" className="text-white text-lg hover:text-white/80 transition">Logout</Link>
      </footer>
    </div>
  );
}

function SomeUploader({ rows }: { rows: Record<string, string>[] }) {
  // ...
}