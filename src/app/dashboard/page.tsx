export default async function DashboardPage({ searchParams }: { searchParams?: { name?: string } }) {
  const params = await searchParams;
  const name = (params && params.name) || "User";

  return (
    <div className="min-h-screen bg-[#3c0ea6] text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-end p-8">
        <nav className="space-x-8">
          <a href="/" className="text-white hover:text-white/80 transition">Home</a>
          <a href="/dashboard" className="text-white hover:text-white/80 transition">Dashboard</a>
        </nav>
      </header>

      {/* Main Content */}
      <h1 className="text-5xl font-bold text-[#ffffff] mb-16 text-center">DC Certificate Portal</h1>
      <main className="flex-1 flex items-center justify-center px-8 pb-20">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl px-16 py-12 text-center">
          {/* Title */}

          {/* Welcome Message */}
          <h2 className="text-4xl font-black text-[#3c0ea6] mb-4">
            Welcome Back {name}!
          </h2>
          <p className="text-2xl text-gray-600 mb-12">
            What Certificate would you like to Process today?
          </p>

          {/* Certificate Options */}
          <div className="flex justify-center gap-8 mb-12">
            <a href={`/dashboard/upload?type=dli-basic&name=${encodeURIComponent(name)}`} className="bg-[#3c0ea6] text-white rounded-2xl px-12 py-10 text-xl font-medium shadow-lg hover:shadow-xl transition min-w-[300px] block text-center">
              Dominion Leadership<br />Institute (DLI) Basic
            </a>
            <a href={`/dashboard/upload?type=dli-advanced&name=${encodeURIComponent(name)}`} className="bg-[#3c0ea6] text-white rounded-2xl px-12 py-10 text-xl font-medium shadow-lg hover:shadow-xl transition min-w-[300px] block text-center">
              Dominion Leadership<br />Institute (DLI) Advanced
            </a>
            <a href={`/dashboard/upload?type=discipleship&name=${encodeURIComponent(name)}`} className="bg-[#3c0ea6] text-white rounded-2xl px-12 py-10 text-xl font-medium shadow-lg hover:shadow-xl transition min-w-[300px] block text-center">
              Discipleship<br />Institute
            </a>
          </div>

          {/* Instruction Text */}
          <p className="text-[#3c0ea6] text-xl font-medium">
            Select an option above and proceed to upload the Trainees' .CSV file
          </p>
        </div>
      </main>

      {/* Logout at bottom */}
      <footer className="p-8 text-center">
        <a href="/" className="text-white text-lg hover:text-white/80 transition">Logout</a>
      </footer>
    </div>
  );
}