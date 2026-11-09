import { useEffect, useMemo, useState } from "react";
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
import cloudControlAPI from "../services/api";

function StoragePage() {
  const [buckets, setBuckets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchBuckets() {
    try {
      setLoading(true);
      setError(null);

      const data = await cloudControlAPI.getS3Buckets();

      const formattedBuckets = (data.buckets || []).map(
        (bucket, index) => ({
          id: bucket.bucket_name || `bucket-${index}`,
          name: bucket.bucket_name || "Unknown",
          region: bucket.region || "Unavailable",
          creationDate: bucket.creation_date
            ? new Date(bucket.creation_date).toLocaleDateString()
            : "—",
          versioning: bucket.versioning || "Unavailable",
          encryption: bucket.encryption || "Unavailable",
          kmsKeyId: bucket.kms_key_id || null,
          size: "Not collected",
          storage: "Not collected",
          status: "Available",
        })
      );

      setBuckets(formattedBuckets);
    } catch (err) {
      console.error("S3 API error:", err);
      setError(err.message || "Unable to fetch S3 buckets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuckets();
  }, []);

  const filteredBuckets = useMemo(() => {
    return buckets.filter((bucket) =>
      [
        bucket.name,
        bucket.region,
        bucket.creationDate,
        bucket.versioning,
        bucket.encryption,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [buckets, search]);

  const enabledVersioning = buckets.filter(
    (bucket) => bucket.versioning === "Enabled"
  ).length;

  const encryptedBuckets = buckets.filter(
    (bucket) =>
      ["AES256", "aws:kms", "aws:kms:dsse"].includes(
        bucket.encryption
      )
  ).length;

  const stats = [
    {
      title: "Total Buckets",
      value: loading ? "..." : buckets.length,
      icon: HardDrive,
    },
    {
      title: "Storage Size",
      value: "Not collected",
      icon: Database,
    },
    {
      title: "Versioning Enabled",
      value: loading ? "..." : enabledVersioning,
      icon: RefreshCw,
    },
    {
      title: "Encryption Configured",
      value: loading ? "..." : encryptedBuckets,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mt-6 space-y-7 text-slate-200">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">
            S3 Storage Management
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Monitor your live AWS S3 bucket inventory and security
            configuration.
          </p>
        </div>

        <button
          onClick={fetchBuckets}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh AWS Data
        </button>
      </div>

      {/* CONNECTION STATUS */}

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-300">
          Live AWS connection · Read-only S3 inventory
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          S3 API error: {error}
        </div>
      )}

      {/* STATISTICS */}

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

              <h3 className="mt-5 text-2xl font-bold text-white">
                {stat.value}
              </h3>
            </div>
          );
        })}
      </section>

      {/* BUCKET INVENTORY */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">
            S3 Bucket Inventory
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Live bucket details, versioning and encryption settings.
          </p>
        </div>

        {/* SEARCH */}

        <div className="relative mt-7">
          <Search
            size={18}
            className="absolute left-3 top-3 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search bucket name, region or security status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* TABLE */}

        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4">Bucket Name</th>
                <th className="pb-4">Creation Date</th>
                <th className="pb-4">Region</th>
                <th className="pb-4">Size</th>
                <th className="pb-4">Storage Class</th>
                <th className="pb-4">Versioning</th>
                <th className="pb-4">Encryption</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredBuckets.map((bucket) => (
                <tr
                  key={bucket.id}
                  className="border-b border-slate-800/70 text-sm transition hover:bg-slate-800/30"
                >
                  <td className="py-5 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <HardDrive
                        size={17}
                        className="text-blue-400"
                      />
                      {bucket.name}
                    </div>
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.creationDate}
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.region}
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.size}
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.storage}
                  </td>

                  <td className="py-5 text-slate-400">
                    {bucket.versioning}
                  </td>

                  <td className="py-5">
                    <span className="flex items-center gap-2 text-xs text-slate-400">
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
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="py-12 text-center text-sm text-slate-400">
              Fetching live S3 bucket information...
            </div>
          )}

          {!loading && !error && filteredBuckets.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              {buckets.length === 0
                ? "No S3 buckets found."
                : "No matching buckets found."}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="mt-5 flex justify-between text-xs text-slate-500">
          <span>
            Showing {filteredBuckets.length} of {buckets.length} buckets
          </span>

          <span className="flex items-center gap-2">
            <Archive size={14} />
            Live AWS Inventory
          </span>
        </div>
      </section>
    </div>
  );
}

export default StoragePage;