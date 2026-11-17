"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Image from "next/image"; 
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Connect your authentication API here
    console.log({ email, password });
  }

  return (
    <main className="min-h-screen bg-canvas-surface flex items-center justify-center px-5 py-2 text-white">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center ">
          <div className="flex items-center justify-center  ">
            <Image
            src="/images/logo.png"
            alt="Nana Creative"
            width={50}
            height={50}
            priority
            className="h-30 w-auto object-contain rounded-lg"/>
          </div>

          <h1 className="text-2xl font-bold tracking-widest">
           <span className="text-brand-dark bg-canvas-surface px-2">NANA</span>  <span className="text-canvas-surface bg-brand-dark px-2">CREATIVE</span>
          </h1>

          <p className="text-brand-emerald text-sm mt-2">
            Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-brand-dark-deep border border-brand-navy rounded-2xl p-8 shadow-2xl">

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-center">
              Welcome back
            </h2>
            <p className="text-canvas-surface text-sm mt-2 text-center">
              Sign in to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Email address
              </label>

              <div className="relative text-brand-navy">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nanacreative.com"
                  className="w-full bg-canvas-surface border border-brand-navy rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-canvas-surface transition-colors placeholder:text-brand-navy"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Password
              </label>

              <div className="relative text-brand-navy ">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy" />

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-canvas-surface border border-brand-navy rounded-xl py-3.5 pl-12 pr-12 text-sm outline-none focus:border-brand-emerald transition-colors placeholder:text-brand-navy"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy hover:text-brand-emerald transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-sm text-[#d4a853] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-lime text-black font-semibold rounded-xl py-3.5 transition-colors cursor-pointer "
            >
              Sign In
            </button>

          </form>

          <div className="mt-7 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white">
              Authorized personnel only.
              <br />
              Contact your administrator for account access.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          © {new Date().getFullYear()} Nana Creative. All rights reserved.
        </p>
      </div>
    </main>
  );
}

