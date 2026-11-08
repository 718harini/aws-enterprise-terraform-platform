import { useState } from "react";
import ComputePage from "./pages/computepage";
import NetworkingPage from "./pages/NetworkingPage";
import StoragePage from "./pages/StoragePage";
import DatabasePage from "./pages/DatabasePage";
import MonitoringPage from "./pages/MonitoringPage";
import SecurityPage from "./pages/SecurityPage";
import CostOptimizationPage from "./pages/CostOptimizationPage";

import {
  LayoutDashboard,
  Server,
  Network,
  Database,
  HardDrive,
  Activity,
  ShieldCheck,
  DollarSign,
  Settings,
  Cloud,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Zap,
  Menu,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// SIDEBAR NAVIGATION

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Compute", icon: Server },
  { name: "Networking", icon: Network },
  { name: "Storage", icon: HardDrive },
  { name: "Databases", icon: Database },
  { name: "Monitoring", icon: Activity },
  { name: "Security", icon: ShieldCheck },
  { name: "Cost Optimization", icon: DollarSign },
];

// DEMO DATA

const cpuData = [
  { time: "09:00", usage: 32 },
  { time: "10:00", usage: 45 },
  { time: "11:00", usage: 38 },
  { time: "12:00", usage: 62 },
  { time: "13:00", usage: 48 },
  { time: "14:00", usage: 70 },
  { time: "15:00", usage: 55 },
  { time: "16:00", usage: 64 },
];

const costData = [
  { month: "May", cost: 120 },
  { month: "Jun", cost: 180 },
  { month: "Jul", cost: 150 },
  { month: "Aug", cost: 240 },
  { month: "Sep", cost: 190 },
  { month: "Oct", cost: 280 },
];

const resourceData = [
  { name: "Compute", value: 40, color: "#3B82F6" },
  { name: "Storage", value: 25, color: "#8B5CF6" },
  { name: "Database", value: 20, color: "#06B6D4" },
  { name: "Network", value: 15, color: "#10B981" },
];

const activities = [
  {
    title: "EC2 instance launched",
    detail: "i-0a12bc34 · us-east-1",
    time: "2 min ago",
    color: "bg-emerald-400",
  },
  {
    title: "S3 bucket created",
    detail: "enterprise-storage-dev",
    time: "18 min ago",
    color: "bg-blue-400",
  },
  {
    title: "Security scan completed",
    detail: "Configured checks processed",
    time: "35 min ago",
    color: "bg-violet-400",
  },
  {
    title: "Terraform deployment",
    detail: "Infrastructure validation passed",
    time: "1 hour ago",
    color: "bg-cyan-400",
  },
];

// PAGE INFORMATION

const pageInformation = {
  Compute: {
    description: "Manage virtual machines and compute resources.",
    metrics: [
      ["Total Instances", "12"],
      ["Running", "09"],
      ["Stopped", "03"],
      ["CPU Average", "54%"],
    ],
  },

  Networking: {
    description: "Monitor VPCs, subnets and network connectivity.",
    metrics: [
      ["VPCs", "03"],
      ["Subnets", "08"],
      ["Security Groups", "12"],
      ["Load Balancers", "02"],
    ],
  },

  Storage: {
    description: "Manage object storage and storage configurations.",
    metrics: [
      ["S3 Buckets", "08"],
      ["Total Objects", "1,240"],
      ["Versioning", "Enabled"],
      ["Encryption", "Enabled"],
    ],
  },

  Databases: {
    description: "Monitor database resources and availability.",
    metrics: [
      ["Total Databases", "04"],
      ["Available", "04"],
      ["Backups", "Enabled"],
      ["Encryption", "Enabled"],
    ],
  },

  Monitoring: {
    description: "Observe infrastructure health, metrics and events.",
    metrics: [
      ["Active Alarms", "02"],
      ["CPU Average", "54%"],
      ["Health Status", "Healthy"],
      ["Events Today", "18"],
    ],
  },

  Security: {
    description: "Review security posture and compliance findings.",
    metrics: [
      ["Security Checks", "103"],
      ["Passed", "71"],
      ["Failed", "32"],
      ["Critical Alerts", "02"],
    ],
  },

  "Cost Optimization": {
    description: "Analyze cloud expenditure and optimization opportunities.",
    metrics: [
      ["Monthly Estimate", "$284.50"],
      ["Potential Savings", "$42"],
      ["Unused Resources", "03"],
      ["Cost Trend", "Decreasing"],
    ],
  },
};

// REUSABLE METRIC CARD

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  positive = true,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-blue-500/50">

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {title}
        </span>

        <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <h3 className="text-3xl font-bold text-white">
          {value}
        </h3>

        {change && (
          <span
            className={`flex items-center gap-1 text-xs ${
              positive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {positive ? (
              <ArrowUpRight size={15} />
            ) : (
              <ArrowDownRight size={15} />
            )}

            {change}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Demonstration data
      </p>
    </div>
  );
}

// MAIN APPLICATION

function App() {

  const [activePage, setActivePage] = useState("Overview");

  const isOverview = activePage === "Overview";

  const currentPage = pageInformation[activePage];

  return (
    <div className="min-h-screen bg-[#080D19] text-slate-200">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-slate-800 bg-[#0B1220]">

        <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-6">

          <div className="rounded-xl bg-blue-500/15 p-2 text-blue-400">
            <Cloud size={27} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">
              CloudControl
            </h1>

            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Enterprise Platform
            </p>
          </div>

        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">

          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
            Infrastructure
          </p>

          {navigation.map((item) => {

            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  activePage === item.name
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={19} />

                {item.name}
              </button>
            );

          })}

        </nav>

        <div className="border-t border-slate-800 p-5">

          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

              <span className="text-xs font-medium text-emerald-400">
                Systems Operational
              </span>

            </div>

          </div>

          <button
            onClick={() => setActivePage("Overview")}
            className="flex items-center gap-3 px-3 text-sm text-slate-400 hover:text-white"
          >
            <Settings size={18} />
            Settings
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="ml-64 min-h-screen p-8">

        {/* HEADER */}

        <header className="mb-9 flex items-center justify-between">

          <div>

            <p className="text-xs text-slate-500">
              Cloud Infrastructure / {activePage}
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {isOverview ? "Infrastructure Overview" : activePage}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {isOverview
                ? "Monitor, analyze and manage your cloud environment."
                : currentPage.description}
            </p>

          </div>

          <div className="flex items-center gap-4">

            <button className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-400 hover:text-white">
              <Search size={19} />
            </button>

            <button className="relative rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-400 hover:text-white">
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
            </button>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-300">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />

              US East (N. Virginia)
            </div>

          </div>

        </header>

        {/* OVERVIEW PAGE */}

        {isOverview && (

          <>

            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                title="EC2 Instances"
                value="12"
                change="+8.2%"
                icon={Server}
              />

              <MetricCard
                title="Storage Buckets"
                value="08"
                change="+2.4%"
                icon={HardDrive}
              />

              <MetricCard
                title="Database Resources"
                value="04"
                change="+4.1%"
                icon={Database}
              />

              <MetricCard
                title="Monthly Cloud Cost"
                value="$284.50"
                change="-5.6%"
                icon={DollarSign}
                positive={false}
              />

            </section>

            {/* CHARTS */}

            <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

                <h3 className="font-semibold text-white">
                  CPU Utilization
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Compute performance · Last 8 hours
                </p>

                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={cpuData}>

                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />

                    <XAxis dataKey="time" stroke="#64748B" fontSize={11} />

                    <YAxis stroke="#64748B" fontSize={11} />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "1px solid #334155",
                        borderRadius: "10px",
                        color: "#fff",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="usage"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fill="url(#cpuGradient)"
                    />

                  </AreaChart>
                </ResponsiveContainer>

              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

                <h3 className="font-semibold text-white">
                  Cloud Cost Analysis
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Monthly expenditure · USD
                </p>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={costData}>

                    <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />

                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />

                    <YAxis stroke="#64748B" fontSize={11} />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "1px solid #334155",
                        borderRadius: "10px",
                        color: "#fff",
                      }}
                    />

                    <Bar
                      dataKey="cost"
                      fill="#8B5CF6"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>
                </ResponsiveContainer>

              </div>

            </section>

            {/* DISTRIBUTION AND ACTIVITY */}

            <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

                <h3 className="font-semibold text-white">
                  Resource Distribution
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Infrastructure allocation
                </p>

                <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">

                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>

                      <Pie
                        data={resourceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                      >

                        {resourceData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}

                      </Pie>

                      <Tooltip />

                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full space-y-4">

                    {resourceData.map((item) => (

                      <div
                        key={item.name}
                        className="flex items-center justify-between text-sm"
                      >

                        <span className="flex items-center gap-2 text-slate-400">

                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />

                          {item.name}

                        </span>

                        <span className="font-semibold text-white">
                          {item.value}%
                        </span>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

                <div className="mb-6 flex items-center justify-between">

                  <div>
                    <h3 className="font-semibold text-white">
                      Recent Activity
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Latest infrastructure events
                    </p>
                  </div>

                  <Zap className="text-yellow-400" size={21} />

                </div>

                <div className="space-y-6">

                  {activities.map((activity) => (

                    <div key={activity.title} className="flex gap-4">

                      <div className="flex flex-col items-center">

                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${activity.color}`} />

                        <span className="mt-2 h-8 w-px bg-slate-800" />

                      </div>

                      <div className="flex-1">

                        <p className="text-sm font-medium text-white">
                          {activity.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {activity.detail}
                        </p>

                      </div>

                      <span className="text-[10px] text-slate-500">
                        {activity.time}
                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </section>

          </>

        )}
    {/* OTHER INFRASTRUCTURE PAGES */}

{!isOverview && (
  <>
    {activePage === "Compute" ? (
      <ComputePage />
    ) : activePage === "Networking" ? (
      <NetworkingPage />
    ) : activePage === "Storage" ? (
  <StoragePage />
) : activePage === "Databases" ? (
  <DatabasePage />
) : activePage === "Monitoring" ? (
  <MonitoringPage />
) : activePage === "Security" ? (
  <SecurityPage />
) : activePage === "Cost Optimization" ? (
  <CostOptimizationPage />
) : (
      <>
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {currentPage.metrics.map(([title, value], index) => {
            const icons = [Server, Activity, Database, ShieldCheck];
            const Icon = icons[index];

            return (
              <MetricCard
                key={title}
                title={title}
                value={value}
                icon={Icon}
              />
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-400" size={25} />
            <h3 className="text-xl font-semibold text-white">
              {activePage} Management
            </h3>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            This section is currently displaying demonstration data.
            Detailed resource tables, filters, actions and backend
            integration will be implemented in the next development phase.
          </p>

          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <p className="text-sm text-blue-300">
              Module Status: Frontend foundation completed.
            </p>
          </div>
        </section>
      </>
    )}
  </>
)}
        {/* FOOTER */}

        <footer className="mt-10 border-t border-slate-800 py-5 text-center text-xs text-slate-600">
          CloudControl · AWS Enterprise Infrastructure Platform · Demo Data
        </footer>

      </main>

    </div>
  );
}

export default App;

