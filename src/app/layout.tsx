import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nana creative portal",
  description: "A creative portal for Nana, a platform for artists and creators to showcase their work and connect with their audience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
