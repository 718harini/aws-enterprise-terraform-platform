import { useMemo, useState } from "react";
import {
  Database,
  Search,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Activity,
  CheckCircle,
  Server,
} from "lucide-react";

const initialDatabases = [
  {
    id: "db-001",
    name: "production-mysql",
    engine: "MySQL",
    version: "8.0",
    type: "RDS",
    size: "db.t3.micro",
    region: "us-east-1",
    backup: "Enabled",
    encryption: "Enabled",
    status: "Available",
  },
  {
    id: "db-002",
    name: "application-postgres",
    engine: "PostgreSQL",
    version: "16.1",
    type: "RDS",
    size: "db.t3.small",
    region: "us-east-1",
    backup: "Enabled",
    encryption: "Enabled",
    status: "Available",
  },
  {
    id: "db-003",
    name: "analytics-database",
    engine: "MariaDB",
    version: "10.11",
    type: "RDS",
    size: "db.t3.micro",
    region: "ap-south-1",
    backup: "Disabled",
    encryption: "Enabled",
    status: "Available",
  },
  {
    id: "db-004",
    name: "application-users",
    engine: "DynamoDB",
    version: "Managed",
    type: "DynamoDB",
    size: "On-Demand",
    region: "us-east-1",
    backup: "Enabled",
    encryption: "Enabled",
    status: "Active",
  },
  {
    id: "db-005",
    name: "session-storage",
    engine: "DynamoDB",
    version: "Managed",
    type: "DynamoDB",
    size: "On-Demand",
    region: "ap-south-1",
    backup: "Disabled",
    encryption: "Enabled",
    status: "Active",
  },
];

function DatabasePage() {
  const [databases, setDatabases] = useState(initialDatabases);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredDatabases = useMemo(() => {
    return databases.filter((db) => {
      const matchesSearch =
        db.name.toLowerCase().includes(search.toLowerCase()) ||
        db.engine.toLowerCase().includes(search.toLowerCase()) ||
        db.region.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "All" || db.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [databases, search, typeFilter]);

  const rdsCount = databases.filter((db) => db.type === "RDS").length;

  const dynamoCount = databases.filter(
    (db) => db.type === "DynamoDB"
  ).length;

  const backupCount = databases.filter(
    (db) => db.backup === "Enabled"
  ).length;

  const stats = [
    {
      title: "Total Databases",
      value: databases.length,
      icon: Database,
    },
    {
      title: "RDS Instances",
      value: rdsCount,
      icon: Server,
    },
    {
      title: "DynamoDB Tables",
      value: dynamoCount,
      icon: HardDrive,
    },
    {
      title: "Backup Enabled",
      value: `${backupCount}/${databases.length}`,
      icon: ShieldCheck,
    },
  ];

  const toggleBackup = (id) => {
    setDatabases((previous) =>
      previous.map((db) =>
        db.id === id
          ? {
              ...db,
              backup:
                db.backup === "Enabled" ? "Disabled" : "Enabled",
            }
          : db
      )
    );
  };

  const resetDemo = () => {
    setDatabases(initialDatabases);
    setSearch("");
    setTypeFilter("All");
  };

  return (
    <div className="mt-6 space-y-7">

      {/* DEMO NOTICE */}

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-blue-300">
          Database Inventory · Simulated data · No live AWS connection
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {stat.title}
                </p>

                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                  <Icon size={21} />
                </div>
              </div>

              <h3 className="mt-5 text-3xl font-bold text-white">
                {stat.value}
              </h3>
            </div>
          );
        })}
      </section>

      {/* DATABASE INVENTORY */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

          <div>
            <h3 className="text-xl font-semibold text-white">
              Database Resource Inventory
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Monitor relational and NoSQL database resources.
            </p>
          </div>

          <button
            onClick={resetDemo}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:text-white"
          >
            <RefreshCw size={16} />
            Reset Demo Data
          </button>

        </div>

        {/* SEARCH AND FILTER */}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-500"
            />

            <input
              type="text"
              placeholder="Search database name, engine or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="All">All Database Types</option>
            <option value="RDS">RDS</option>
            <option value="DynamoDB">DynamoDB</option>
          </select>

        </div>

        {/* TABLE */}

        <div className="mt-7 overflow-x-auto">

          <table className="w-full min-w-[1050px] text-left">

            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4">Database</th>
                <th className="pb-4">Engine</th>
                <th className="pb-4">Type</th>
                <th className="pb-4">Instance / Capacity</th>
                <th className="pb-4">Region</th>
                <th className="pb-4">Backup</th>
                <th className="pb-4">Encryption</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredDatabases.map((db) => (
                <tr
                  key={db.id}
                  className="border-b border-slate-800/70 text-sm hover:bg-slate-800/30"
                >
                  <td className="py-5 font-medium text-white">
                    {db.name}
                  </td>

                  <td className="py-5 text-slate-400">
                    {db.engine} {db.version}
                  </td>

                  <td className="py-5 text-slate-400">
                    {db.type}
                  </td>

                  <td className="py-5 text-slate-400">
                    {db.size}
                  </td>

                  <td className="py-5 text-slate-400">
                    {db.region}
                  </td>

                  <td className="py-5">
                    <span
                      className={
                        db.backup === "Enabled"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      {db.backup}
                    </span>
                  </td>

                  <td className="py-5">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <ShieldCheck size={14} />
                      {db.encryption}
                    </span>
                  </td>

                  <td className="py-5">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle size={13} />
                      {db.status}
                    </span>
                  </td>

                  <td className="py-5">
                    <button
                      onClick={() => toggleBackup(db.id)}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 hover:bg-blue-500/20"
                    >
                      Toggle Backup
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          {filteredDatabases.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching databases found.
            </div>
          )}

        </div>

        <div className="mt-5 flex justify-between text-xs text-slate-500">
          <span>
            Showing {filteredDatabases.length} of {databases.length} databases
          </span>

          <span className="flex items-center gap-2">
            <Activity size={14} />
            Database Monitoring
          </span>
        </div>

      </section>

    </div>
  );
}

export default DatabasePage;