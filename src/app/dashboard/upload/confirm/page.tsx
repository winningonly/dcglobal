export default async function ConfirmPage({ searchParams }: { searchParams?: { type?: string; name?: string } }) {
  const params = await searchParams;
  const type = params?.type || "dli-basic";
  const name = params?.name || "User";
  const map: Record<string, string> = {
    "dli-basic": "DLI Basic",
    "dli-advanced": "DLI Advanced",
    "discipleship": "Discipleship Institute",
  };
  return (
    <div className="min-h-screen bg-[#3c0ea6] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl p-10 text-[#3c0ea6] text-center">
        <h1 className="text-3xl font-bold">Upload received</h1>
        <p className="mt-4">Thank you, {name}. We received your CSV for {map[type] || map['dli-basic']}.</p>
        <div className="mt-8">
          <a href="/dashboard" className="text-sm text-[#3c0ea6]">Back to dashboard</a>
        </div>
      </div>
    </div>
  );
}
