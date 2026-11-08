import { useMemo, useState } from "react";
import {
  HardDrive,
  Search,
  Lock,
  RefreshCw,
  Database,
  ShieldCheck,
  Archive,
  CheckCircle,
} from "lucide-react";

const initialBuckets = [
  {
    id: "bucket-001",
    name: "enterprise-production-data",
    region: "us-east-1",
    storage: "Standard",
    size: "245 GB",
    versioning: "Enabled",
    encryption: "AES-256",
    status: "Active",
  },
  {
    id: "bucket-002",
    name: "application-backups",
    region: "us-east-1",
    storage: "Standard-IA",
    size: "120 GB",
    versioning: "Enabled",
    encryption: "AES-256",
    status: "Active",
  },
  {
    id: "bucket-003",
    name: "terraform-state-storage",
    region: "ap-south-1",
    storage: "Standard",
    size: "2 GB",
    versioning: "Enabled",
    encryption: "SSE-KMS",
    status: "Active",
  },
  {
    id: "bucket-004",
    name: "application-logs-archive",
    region: "us-east-1",
    storage: "Glacier",
    size: "580 GB",
    versioning: "Disabled",
    encryption: "AES-256",
    status: "Active",
  },
  {
    id: "bucket-005",
    name: "development-assets",
    region: "ap-south-1",
    storage: "Standard",
    size: "18 GB",
    versioning: "Disabled",
    encryption: "AES-256",
    status: "Active",
  },
];

function StoragePage() {
  const [buckets, setBuckets] = useState(initialBuckets);
  const [search, setSearch] = useState("");
  const [storageFilter, setStorageFilter] = useState("All");

  const filteredBuckets = useMemo(() => {
    return buckets.filter((bucket) => {
      const matchesSearch =
        bucket.name.toLowerCase().includes(search.toLowerCase()) ||
        bucket.region.toLowerCase().includes(search.toLowerCase());

      const matchesStorage =
        storageFilter === "All" ||
        bucket.storage === storageFilter;

      return matchesSearch && matchesStorage;
    });
  }, [buckets, search, storageFilter]);

  const totalSize = buckets.reduce(
    (total, bucket) =>
      total + Number.parseInt(bucket.size, 10),
    0
  );

  const versionedBuckets = buckets.filter(
    (bucket) => bucket.versioning === "Enabled"
  ).length;

  const encryptedBuckets = buckets.filter(
    (bucket) => bucket.encryption !== "None"
  ).length;

  const stats = [
    {
      title: "Total Buckets",
      value: buckets.length,
      icon: HardDrive,
    },
    {
      title: "Total Storage",
      value: `${totalSize} GB`,
      icon: Database,
    },
    {
      title: "Versioning Enabled",
      value: `${versionedBuckets}/${buckets.length}`,
      icon: RefreshCw,
    },
    {
      title: "Encrypted Buckets",
      value: `${encryptedBuckets}/${buckets.length}`,
      icon: ShieldCheck,
    },
  ];

  const toggleVersioning = (bucketId) => {
    setBuckets((previous) =>
      previous.map((bucket) =>
        bucket.id === bucketId
          ? {
              ...bucket,
              versioning:
                bucket.versioning === "Enabled"
                  ? "Disabled"
                  : "Enabled",
            }
          : bucket
      )
    );
  };

  const resetDemo = () => {
    setBuckets(initialBuckets);
    setSearch("");
    setStorageFilter("All");
  };

  return (
    <div className="mt-6 space-y-7">

      {/* DEMO NOTICE */}

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-blue-300">
          S3 Storage Inventory · Simulated data · No live AWS connection
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

      {/* BUCKET INVENTORY */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

          <div>
            <h3 className="text-xl font-semibold text-white">
              S3 Bucket Inventory
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Monitor storage configurations and security settings.
            </p>
          </div>

          <button
            onClick={resetDemo}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:text-white"
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
              placeholder="Search bucket name or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={storageFilter}
            onChange={(e) => setStorageFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="All">All Storage Classes</option>
            <option value="Standard">Standard</option>
            <option value="Standard-IA">Standard-IA</option>
            <option value="Glacier">Glacier</option>
          </select>

        </div>

        {/* TABLE */}

        <div className="mt-7 overflow-x-auto">

          <table className="w-full min-w-[950px] text-left">

            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4">Bucket Name</th>
                <th className="pb-4">Region</th>
                <th className="pb-4">Size</th>
                <th className="pb-4">Storage Class</th>
                <th className="pb-4">Versioning</th>
                <th className="pb-4">Encryption</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredBuckets.map((bucket) => (
                <tr
                  key={bucket.id}
                  className="border-b border-slate-800/70 text-sm hover:bg-slate-800/30"
                >
                  <td className="py-5 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <HardDrive size={17} className="text-blue-400" />
                      {bucket.name}
                    </div>
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.region}
                  </td>

                  <td className="py-5 text-slate-300">
                    {bucket.size}
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.storage}
                  </td>

                  <td className="py-5">
                    <span className="text-xs text-slate-300">
                      {bucket.versioning}
                    </span>
                  </td>

                  <td className="py-5">
                    <span className="flex items-center gap-2 text-xs text-emerald-400">
                      <Lock size={13} />
                      {bucket.encryption}
                    </span>
                  </td>

                  <td className="py-5">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle size={13} />
                      {bucket.status}
                    </span>
                  </td>

                  <td className="py-5">
                    <button
                      onClick={() => toggleVersioning(bucket.id)}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 hover:bg-blue-500/20"
                    >
                      Toggle Versioning
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          {filteredBuckets.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching buckets found.
            </div>
          )}

        </div>

        <div className="mt-5 flex justify-between text-xs text-slate-500">
          <span>
            Showing {filteredBuckets.length} of {buckets.length} buckets
          </span>

          <span className="flex items-center gap-2">
            <Archive size={14} />
            Storage Management
          </span>
        </div>

      </section>

    </div>
  );
}

export default StoragePage;