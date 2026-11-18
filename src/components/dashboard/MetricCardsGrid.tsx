"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Activity,
  TrendingUp,
  Inbox,
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

interface SystemStats {
  publishedPosts: number;
  registeredUsers: number;
  apiStatus: "operational" | "degraded" | "checking";
  latencyMs?: number;
  contactRequests?: number;
}

interface MetricCardsGridProps {
  stats: SystemStats;
  loading?: boolean;
}

export default function MetricCardsGrid({
  stats,
  loading = false,
}: MetricCardsGridProps) {
  const cards = [
    {
      title: "Total Posts",
      value: stats.publishedPosts,
      decimals: 0,
      suffix: "",
      icon: BookOpen,
      iconBg: "bg-brand-primary text-brand-accent",
      subtext: "Editorial publications",
      statusBadge: "Active",
      isLive: true,
      href: "/admin/blogs",
    },
    {
      title: "Total Users",
      value: stats.registeredUsers,
      decimals: 0,
      suffix: "",
      icon: Users,
      iconBg: "bg-brand-primary/10 dark:bg-brand-primary/40 text-brand-accent",
      subtext: "Registered team accounts",
      statusBadge: "Active",
      isLive: true,
      href: "/admin/users",
    },
    {
      title: "Contact Requests",
      value: stats.contactRequests ?? 0,
      decimals: 0,
      suffix: "",
      icon: Inbox,
      iconBg: "bg-brand-primary text-brand-accent",
      subtext: "Client project inquiries",
      statusBadge: "Live",
      isLive: true,
      href: "/admin/contacts",
    },
    {
      title: "System Health",
      value: stats.latencyMs ? stats.latencyMs : 24,
      decimals: 0,
      suffix: "ms",
      icon: Activity,
      iconBg: "bg-brand-primary text-brand-accent",
      subtext: "Service response latency",
      statusBadge: stats.apiStatus === "operational" ? "Operational" : "Degraded",
      isLive: true,
    },
    {
      title: "Audience & Reach",
      value: 0,
      isPending: true,
      icon: TrendingUp,
      iconBg: "bg-border-subtle text-gray-400 dark:text-gray-300",
      subtext: "Creator & partner analytics",
      statusBadge: "In Development",
      isLive: false,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        const cardBody = (
          <>
            {/* Ambient Top Glow Line on Hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                    {card.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${card.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Number Value / Pending State Label */}
                {card.isPending ? (
                  <div className="py-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-accent text-xs font-semibold tracking-wider border border-brand-accent/20">
                      <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                      In Development
                    </span>
                  </div>
                ) : (
                  <div className="text-3xl font-extrabold text-text-primary tracking-tight">
                    {loading ? (
                      <div className="h-9 w-20 bg-border-subtle animate-pulse rounded-lg" />
                    ) : (
                      <AnimatedCounter
                        value={card.value}
                        decimals={card.decimals}
                        suffix={card.suffix}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                <span className="text-gray-400 text-xs truncate">
                  {card.subtext}
                </span>

                <div
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    card.isPending
                      ? "bg-bg-app text-gray-400 border border-border-subtle"
                      : "bg-brand-primary text-brand-accent"
                  }`}
                >
                  <span>{card.statusBadge}</span>
                </div>
              </div>
            </div>
          </>
        );

        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            className="group relative bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
          >
            {card.href ? (
              <Link href={card.href} className="flex-1 flex flex-col justify-between">
                {cardBody}
              </Link>
            ) : (
              cardBody
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
