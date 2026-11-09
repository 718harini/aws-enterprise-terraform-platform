import { useEffect, useMemo, useState } from "react";
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

import cloudControlAPI from "../services/api";

function DatabasePage() {
  const [databases, setDatabases] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await cloudControlAPI.getDatabases();

      // Accept the response formats used by the backend.
      const databaseList =
        data.databases || data.instances || data.db_instances || [];

      const formattedDatabases = databaseList.map((db, index) => {
        const backupRetention =
          db.backup_retention_period ??
          db.backup_retention_days ??
          db.BackupRetentionPeriod ??
          0;

        const encrypted =
          db.storage_encrypted ??
          db.encrypted ??
          db.StorageEncrypted ??
          false;

        const status =
          db.status ||
          db.db_instance_status ||
          db.DBInstanceStatus ||
          "Unknown";

        return {
          id:
            db.db_instance_identifier ||
            db.identifier ||
            db.DBInstanceIdentifier ||
            `database-${index}`,

          name:
            db.db_instance_identifier ||
            db.identifier ||
            db.DBInstanceIdentifier ||
            "Unnamed database",

          engine:
            db.engine ||
            db.Engine ||
            "Unknown",

          version:
            db.engine_version ||
            db.EngineVersion ||
            "",

          type: "RDS",

          size:
            db.instance_class ||
            db.DBInstanceClass ||
            "Unknown",

          region:
            db.availability_zone ||
            db.AvailabilityZone ||
            "us-east-1",

          backup: Number(backupRetention) > 0 ? "Enabled" : "Disabled",

          encryption: encrypted ? "Enabled" : "Disabled",

          status:
            status.charAt(0).toUpperCase() + status.slice(1),

          endpoint:
            db.endpoint?.address ||
            db.endpoint ||
            db.Endpoint?.Address ||
            "Not available",
        };
      });

      setDatabases(formattedDatabases);
    } catch (err) {
      console.error("Database API error:", err);
      setError(err.message || "Unable to load database information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const filteredDatabases = useMemo(() => {
    return databases.filter((db) => {
      const searchText = search.toLowerCase();

      return (
        db.name.toLowerCase().includes(searchText) ||
        db.engine.toLowerCase().includes(searchText) ||
        db.region.toLowerCase().includes(searchText)
      );
    });
  }, [databases, search]);

  const backupCount = databases.filter(
    (db) => db.backup === "Enabled"
  ).length;

  const encryptionCount = databases.filter(
    (db) => db.encryption === "Enabled"
  ).length;

  const availableCount = databases.filter(
    (db) => db.status.toLowerCase() === "available"
  ).length;

  const stats = [
    {
      title: "Total RDS Instances",
      value: databases.length,
      icon: Database,
    },
    {
      title: "Available Instances",
      value: availableCount,
      icon: Server,
    },
    {
      title: "Backup Enabled",
      value: `${backupCount}/${databases.length}`,
      icon: HardDrive,
    },
    {
      title: "Encrypted Instances",
      value: `${encryptionCount}/${databases.length}`,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mt-6 space-y-7">

      {/* LIVE AWS NOTICE */}

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-300">
          Live AWS RDS Inventory · Read-only connection · Region: us-east-1
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
                {loading ? "..." : stat.value}
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
              Live relational database resources retrieved from AWS RDS.
            </p>
          </div>

          <button
            onClick={fetchDatabases}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

        {/* SEARCH */}

        <div className="mt-7">

          <div className="relative">
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

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* TABLE */}

        <div className="mt-7 overflow-x-auto">

          <table className="w-full min-w-[1050px] text-left">

            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4">Database</th>
                <th className="pb-4">Engine</th>
                <th className="pb-4">Type</th>
                <th className="pb-4">Instance Class</th>
                <th className="pb-4">Availability Zone</th>
                <th className="pb-4">Backup</th>
                <th className="pb-4">Encryption</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>

            <tbody>

              {!loading &&
                filteredDatabases.map((db) => (
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
                      <span
                        className={
                          db.encryption === "Enabled"
                            ? "flex items-center gap-1 text-xs text-emerald-400"
                            : "text-xs text-amber-400"
                        }
                      >
                        {db.encryption === "Enabled" && (
                          <ShieldCheck size={14} />
                        )}
                        {db.encryption}
                      </span>
                    </td>

                    <td className="py-5">
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle size={13} />
                        {db.status}
                      </span>
                    </td>
                  </tr>
                ))}

            </tbody>

          </table>

          {/* LOADING */}

          {loading && (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading live AWS database resources...
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && filteredDatabases.length === 0 && (
            <div className="py-12 text-center">
              <Database
                size={32}
                className="mx-auto mb-3 text-slate-600"
              />

              <p className="text-sm text-slate-400">
                No RDS instances found in us-east-1.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                This is valid if no RDS databases are deployed in this region.
              </p>
            </div>
          )}

        </div>

        <div className="mt-5 flex justify-between text-xs text-slate-500">
          <span>
            Showing {filteredDatabases.length} of {databases.length} RDS instances
          </span>

          <span className="flex items-center gap-2">
            <Activity size={14} />
            Live AWS Monitoring
          </span>
        </div>

      </section>

    </div>
  );
}

export default DatabasePage;