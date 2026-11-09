import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Server,
  Play,
  Square,
  Filter,
  MoreHorizontal,
} from "lucide-react";

import cloudControlAPI from "../services/api";

export default function ComputePage() {
  const [instances, setInstances] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchInstances() {
    try {
      setLoading(true);
      setError(null);

      const data = await cloudControlAPI.getEC2Instances();

      const formattedInstances = (data.instances || []).map((instance) => {
        const state = String(instance.state || "Unknown").toLowerCase();

        return {
          id: instance.instance_id,
          name: instance.name || "Unnamed Instance",
          type: instance.instance_type || "—",
          zone: instance.availability_zone || "—",
          privateIp: instance.private_ip || "—",
          publicIp: instance.public_ip || "—",
          status:
            state === "running"
              ? "Running"
              : state === "stopped"
                ? "Stopped"
                : state.charAt(0).toUpperCase() + state.slice(1),
        };
      });

      setInstances(formattedInstances);
    } catch (err) {
      console.error("EC2 API error:", err);
      setError(err.message || "Unable to fetch EC2 instances.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInstances();
  }, []);

  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      const searchableValues = [
        instance.id,
        instance.name,
        instance.type,
        instance.zone,
        instance.privateIp,
        instance.publicIp,
        instance.status,
      ];

      const matchesSearch = searchableValues
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

  return (
    <div className="space-y-6 text-slate-200">

      {/* Header */}
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
            Monitor your live AWS EC2 infrastructure.
          </p>
        </div>

        <button
          onClick={fetchInstances}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh AWS Data
        </button>
      </div>

      {/* Connection Status */}
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
        Live AWS connection — read-only EC2 inventory.
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Unable to load EC2 data: {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Instances"
          value={loading ? "..." : instances.length}
          icon={<Server size={20} />}
        />

        <SummaryCard
          title="Running"
          value={loading ? "..." : runningCount}
          icon={<Play size={20} />}
          accent="text-emerald-400"
        />

        <SummaryCard
          title="Stopped"
          value={loading ? "..." : stoppedCount}
          icon={<Square size={20} />}
          accent="text-amber-400"
        />
      </div>

      {/* Instance Inventory */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center">
          <div>
            <h3 className="font-semibold text-white">
              EC2 Instances
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Fetching AWS resources..."
                : `${filteredInstances.length} of ${instances.length} instances shown`}
            </p>
          </div>

          {/* Search and Filter */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">

            <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Instance</th>
                <th className="px-5 py-4">Instance Type</th>
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
                    <p className="font-medium text-white">
                      {instance.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {instance.id}
                    </p>
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

                  <td className="px-5 py-4 text-slate-500">
                    <span title="Read-only monitoring">
                      <MoreHorizontal size={18} />
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && !error && filteredInstances.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    {instances.length === 0
                      ? "No EC2 instances found in this AWS region."
                      : "No matching instances found."}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Fetching live EC2 information...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-red-400"
                  >
                    Unable to display EC2 instances.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
          <span>
            {loading
              ? "Loading..."
              : `Showing ${filteredInstances.length} instances`}
          </span>

          <MoreHorizontal size={18} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  accent = "text-cyan-400",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className={accent}>{icon}</span>
      </div>

      <p className="mt-4 text-3xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const isRunning = status === "Running";
  const isStopped = status === "Stopped";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        isRunning
          ? "bg-emerald-500/10 text-emerald-400"
          : isStopped
            ? "bg-amber-500/10 text-amber-400"
            : "bg-slate-500/10 text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isRunning
            ? "bg-emerald-400"
            : isStopped
              ? "bg-amber-400"
              : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}