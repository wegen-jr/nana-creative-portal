import LuxuryLogin from "@/components/auth/LuxuryLogin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Nana Workspace",
  description: "Enter your credentials to access the internal system.",
};

export default function LoginPage() {
  return <LuxuryLogin />;
}
