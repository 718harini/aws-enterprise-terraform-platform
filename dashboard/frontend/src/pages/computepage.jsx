import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Server,
  Play,
  Square,
  Filter,
  MoreHorizontal,
} from "lucide-react";

const initialInstances = [
  {
    id: "i-0a12bc34de56f7890",
    name: "production-web-01",
    type: "t3.medium",
    zone: "us-east-1a",
    privateIp: "10.0.1.15",
    publicIp: "54.210.10.25",
    status: "Running",
  },
  {
    id: "i-0b23cd45ef67a8901",
    name: "application-server",
    type: "t3.large",
    zone: "us-east-1b",
    privateIp: "10.0.2.20",
    publicIp: "54.210.10.26",
    status: "Running",
  },
  {
    id: "i-0c34de56fa78b9012",
    name: "testing-instance",
    type: "t3.micro",
    zone: "us-east-1a",
    privateIp: "10.0.1.30",
    publicIp: "—",
    status: "Stopped",
  },
  {
    id: "i-0d45ef67ab89c0123",
    name: "monitoring-server",
    type: "t3.small",
    zone: "us-east-1c",
    privateIp: "10.0.3.40",
    publicIp: "54.210.10.28",
    status: "Running",
  },
];

export default function ComputePage() {
  const [instances, setInstances] = useState(initialInstances);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      const matchesSearch = [
        instance.id,
        instance.name,
        instance.type,
        instance.privateIp,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || instance.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [instances, search, statusFilter]);

  const runningCount = instances.filter(
    (instance) => instance.status === "Running"
  ).length;

  const stoppedCount = instances.filter(
    (instance) => instance.status === "Stopped"
  ).length;

  function toggleInstance(instanceId) {
    setInstances((currentInstances) =>
      currentInstances.map((instance) => {
        if (instance.id !== instanceId) return instance;

        return {
          ...instance,
          status: instance.status === "Running" ? "Stopped" : "Running",
        };
      })
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>Cloud Resources</span>
            <span>/</span>
            <span className="text-cyan-400">Compute</span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            Compute Instances
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Monitor and manage your EC2 instances.
          </p>
        </div>

        <button
          onClick={() => {
            setInstances(initialInstances);
            setSearch("");
            setStatusFilter("All");
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-white"
        >
          <RefreshCw size={16} />
          Reset Demo Data
        </button>
      </div>

      {/* Demo notice */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        Demo environment — instance information is simulated. No AWS resources
        are being accessed or modified.
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Instances"
          value={instances.length}
          icon={<Server size={20} />}
        />

        <SummaryCard
          title="Running"
          value={runningCount}
          icon={<Play size={20} />}
          accent="text-emerald-400"
        />

        <SummaryCard
          title="Stopped"
          value={stoppedCount}
          icon={<Square size={20} />}
          accent="text-amber-400"
        />
      </div>

      {/* Instance table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center">
          <div>
            <h3 className="font-semibold text-white">EC2 Instances</h3>
            <p className="mt-1 text-xs text-slate-500">
              {filteredInstances.length} of {instances.length} instances shown
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                placeholder="Search instances..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 sm:w-64"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-8 text-sm text-slate-300 outline-none focus:border-cyan-500"
              >
                <option value="All">All statuses</option>
                <option value="Running">Running</option>
                <option value="Stopped">Stopped</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Instance</th>
                <th className="px-5 py-4">Instance type</th>
                <th className="px-5 py-4">Availability Zone</th>
                <th className="px-5 py-4">Private IP</th>
                <th className="px-5 py-4">Public IP</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredInstances.map((instance) => (
                <tr
                  key={instance.id}
                  className="transition hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{instance.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{instance.id}</p>
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {instance.type}
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {instance.zone}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-400">
                    {instance.privateIp}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-400">
                    {instance.publicIp}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={instance.status} />
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleInstance(instance.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        instance.status === "Running"
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      }`}
                    >
                      {instance.status === "Running" ? "Stop" : "Start"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInstances.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No matching instances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
          <span>Showing {filteredInstances.length} instances</span>
          <MoreHorizontal size={18} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, accent = "text-cyan-400" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className={accent}>{icon}</span>
      </div>

      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const isRunning = status === "Running";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        isRunning
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-amber-500/10 text-amber-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isRunning ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {status}
    </span>
  );
}