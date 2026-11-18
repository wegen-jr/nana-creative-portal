"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";

const CinematicCanvas = dynamic(() => import("./CinematicCanvas"), {
  ssr: false,
});

export default function LuxuryLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      toast.success("Welcome back to Nana Creative", 200);
      router.push("/admin");
    } catch (err: unknown) {
      const errString =
        (err as Error).message ||
        "Invalid email or password. Please verify your credentials.";
      setErrorMessage(errString);
      toast.error(errString, 401);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#08101A] text-[#F7F9F8]"
    >
      {/* LEFT COLUMN: Visual Brand Showcase (Desktop only, hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-[#0B3B24]/40">
        {/* Full-Bleed 3D Digital Growth Particle Wave */}
        <CinematicCanvas />

        {/* Atmospheric Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08101A] via-transparent to-[#08101A]/60 pointer-events-none z-1" />

        {/* Top Brand Identity */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-full bg-[#0B3B24] border-2 border-[#8CC63F] flex items-center justify-center shadow-[0_0_20px_rgba(140,198,63,0.4)] p-2">
            <Image
              src="/images/logo.png"
              alt="Nana Creative"
              width={26}
              height={26}
              className="object-contain filter brightness-0 invert"
              priority
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#8CC63F] ring-2 ring-[#0B3B24]" />
          </div>
          <div>
            <span className="block font-extrabold tracking-[0.2em] text-sm text-[#F7F9F8]">
              NANA CREATIVE
            </span>
            <span className="block text-[10px] font-bold text-[#8CC63F] tracking-widest uppercase font-mono">
              Internal Admin
            </span>
          </div>
        </div>

        {/* Centerpiece Statement */}
        <div className="relative z-10 max-w-lg space-y-4 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3B24]/80 border border-[#8CC63F]/30 text-[#8CC63F] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Workspace</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-[#F7F9F8] tracking-tight leading-tight">
            Curate Publications &amp; Brand Media with Precision.
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed font-light">
            Centralized command center for managing editorial publications, team access, and digital presence across the Nana Creative ecosystem.
          </p>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-500 font-mono">
          <ShieldCheck className="w-4 h-4 text-[#8CC63F]" />
          <span>Encrypted Session • Role-Based Access Control</span>
        </div>
      </div>

      {/* RIGHT COLUMN / MOBILE COLUMN: Clean Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 relative z-10 min-h-screen lg:min-h-0 bg-bg-app lg:bg-[#08101A]">
        {/* Mobile atmospheric background glow */}
        <div className="lg:hidden absolute inset-0 bg-radial-gradient from-[#0B3B24]/20 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-md mx-auto">
          {/* Brand Centerpiece (Always visible on mobile & desktop) */}
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className="relative w-16 h-16 rounded-full bg-[#0B3B24] border-2 border-[#8CC63F] flex items-center justify-center shadow-[0_0_28px_rgba(140,198,63,0.5)] p-3 transition-transform hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="Nana Creative"
                width={42}
                height={42}
                className="object-contain filter brightness-0 invert"
                priority
              />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#8CC63F] shadow-[0_0_12px_#8CC63F] ring-2 ring-[#0B3B24]" />
            </div>

            <h1 className="mt-4 text-base font-extrabold tracking-[0.22em] text-text-primary uppercase">
              Nana Creative
            </h1>
            <span className="text-[11px] font-bold text-brand-accent tracking-widest uppercase mt-0.5 font-mono">
              Internal Portal
            </span>
            <p className="text-xs text-gray-400 mt-2">
              Sign in with your workspace credentials
            </p>
          </div>

          {/* Frosted Container */}
          <div className="rounded-3xl bg-bg-surface border border-border-subtle p-7 sm:p-9 shadow-sm transition-all">
            {/* Dynamic Error Feedback Notice */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field with Floating Label */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full h-13 px-4 pt-4 pb-1 text-xs sm:text-sm text-text-primary bg-bg-app border border-border-subtle rounded-xl outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder-transparent"
                  autoComplete="email"
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-3.5 text-xs text-gray-400 font-medium transition-all pointer-events-none origin-[0] peer-focus:text-[10px] peer-focus:-translate-y-2.5 peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:text-brand-accent"
                >
                  Email Address
                </label>
              </div>

              {/* Password Field with Floating Label & Eye Toggle */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full h-13 pl-4 pr-11 pt-4 pb-1 text-xs sm:text-sm text-text-primary bg-bg-app border border-border-subtle rounded-xl outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder-transparent font-mono"
                  autoComplete="current-password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-3.5 text-xs text-gray-400 font-medium transition-all pointer-events-none origin-[0] peer-focus:text-[10px] peer-focus:-translate-y-2.5 peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:text-brand-accent"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-accent transition-colors focus:outline-none p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Solid #0B3B24 (Emerald) Login Button with Clean Spinner */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 mt-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          {/* Mobile Footer note */}
          <div className="mt-6 text-center">
            <span className="text-[11px] text-gray-400 font-mono">
              Protected by Enterprise Authentication
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
