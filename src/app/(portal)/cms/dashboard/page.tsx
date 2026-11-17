import {
  Newspaper,
  BriefcaseBusiness,
  Handshake,
  MessageSquareQuote,
  Globe,
  Clock,
  Bell
} from "lucide-react";

const stats = [
  {
    title: "Blog Posts",
    value: 48,
    description: "32 published · 16 drafts",
    icon: Newspaper,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    trend: "+12%",
  },
  {
    title: "Projects",
    value: 24,
    description: "20 published · 4 drafts",
    icon: BriefcaseBusiness,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    trend: "+8%",
  },
  {
    title: "Partnerships",
    value: 12,
    description: "Active organizations",
    icon: Handshake,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    trend: "+2",
  },
];
export default function DashboardPage() {
  const DateNow=()=>{
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  }
  return (
    <div className="mt-15 sm:mt-0">
      <div className="flex items-center justify-between px-1 py-2 shadow-2xl">
        <h1 className="sm:font-bold sm:text-lg text-sm">
          welcome back to CMS Dashboard, wegen
        </h1>
      <div className="flex items-center justify-center"> 
        <p className="text-sm text-brand-dark px-3">
          {DateNow()}
        </p>
        <div>
          <Bell className="w-5 h-15"/>
        </div>
      </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 mt-2 mx-2" >
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-3 ${stat.iconBg}`}>
                <Icon size={22} className={stat.iconColor} />
              </div>

              {stat.trend && (
                <span className="text-sm font-medium text-brand-dark">
                  {stat.trend}
                </span>
              )}
            </div>

            <div className="mt-5">
              <h2 className="text-3xl font-bold text-brand-dark">
                {stat.value}
              </h2>

              <p className="mt-1 font-medium text-brand-dark">
                {stat.title}
              </p>

              <p className="mt-1 text-sm text-brand-dark">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}