"use client";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCredentialError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // successful login or account creation — redirect to dashboard with name
        const name = data?.name || email.split("@")[0];
        // use a simple query param for this demo
        window.location.href = `/dashboard?name=${encodeURIComponent(name)}`;
      } else {
        // show specific credential error under password
        if (data?.error === "username or password is incorrect") {
          setCredentialError("username or password is incorrect");
        } else {
          setMessage(data?.error || "Unexpected error");
        }
      }
    } catch (err) {
      setMessage("Network error");
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block w-1/2 relative">
        <Image
          src="/login_cert_pic.png"
          alt="left image"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 bg-[#3c0ea6] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center text-[#3c0ea6] mb-2">DC Certificate Portal</h2>
          <div className="mt-4 p-6 bg-white rounded">
            <h3 className="text-xl font-semibold text-center mb-2">Sign In</h3>
            <p className="text-center text-gray-400 text-sm mb-6">Welcome back! Please enter your details</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full mt-2 p-3 border border-gray-300 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c0ea6]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full mt-2 p-3 border border-gray-300 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c0ea6]"
                />
                {credentialError && (
                  <p className="mt-2 text-sm text-red-600">{credentialError}</p>
                )}
              </div>

              <div className="flex justify-end text-sm">
                <a className="text-[#6b21a8]">Forgot Password</a>
              </div>

              <button className="w-full bg-[#3c0ea6] text-white py-3 rounded font-semibold">Continue</button>
            </form>

            {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}

            <p className="mt-6 text-center text-xs text-gray-400">To login, you must be approved by DCHQ Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}