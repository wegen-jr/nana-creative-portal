"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasToken = authService.isAuthenticated();
    if (!hasToken) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!mounted || !authorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-app text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          <span className="text-xs font-mono font-semibold tracking-wider text-gray-400">
            Verifying Authentication...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
