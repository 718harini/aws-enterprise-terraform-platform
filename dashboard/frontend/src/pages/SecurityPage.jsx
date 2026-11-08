import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Users,
  Search,
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const initialFindings = [
  {
    id: "SEC-001",
    title: "S3 Bucket Public Access",
    resource: "enterprise-data-bucket",
    service: "S3",
    severity: "CRITICAL",
    status: "OPEN",
  },
  {
    id: "SEC-002",
    title: "Unrestricted Security Group Ingress",
    resource: "web-server-sg",
    service: "EC2",
    severity: "HIGH",
    status: "OPEN",
  },
  {
    id: "SEC-003",
    title: "Encryption Enabled",
    resource: "application-storage",
    service: "S3",
    severity: "LOW",
    status: "RESOLVED",
  },
  {
    id: "SEC-004",
    title: "IAM Policy with Broad Permissions",
    resource: "developer-role",
    service: "IAM",
    severity: "MEDIUM",
    status: "OPEN",
  },
  {
    id: "SEC-005",
    title: "CloudTrail Logging Enabled",
    resource: "enterprise-trail",
    service: "CloudTrail",
    severity: "LOW",
    status: "RESOLVED",
  },
];

const initialControls = [
  { name: "S3 Encryption", category: "Data Protection", status: "PASS" },
  { name: "MFA Enforcement", category: "Identity Security", status: "PASS" },
  { name: "CloudTrail Logging", category: "Audit Logging", status: "PASS" },
  { name: "Public Access Blocking", category: "Network Security", status: "FAIL" },
  { name: "IAM Least Privilege", category: "Access Management", status: "FAIL" },
  { name: "EBS Encryption", category: "Data Protection", status: "PASS" },
];

export default function SecurityPage() {
  const [findings, setFindings] = useState(initialFindings);
  const [controls] = useState(initialControls);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filteredFindings = findings.filter((finding) => {
    const matchesSearch = `${finding.id} ${finding.title} ${finding.resource} ${finding.service}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "ALL" || finding.severity === filter;

    return matchesSearch && matchesFilter;
  });

  const resolveFinding = (id) => {
    setFindings((previous) =>
      previous.map((finding) =>
        finding.id === id
          ? { ...finding, status: "RESOLVED" }
          : finding
      )
    );
  };

  const resetData = () => {
    setFindings(initialFindings);
    setSearch("");
    setFilter("ALL");
  };

  const openFindings = findings.filter(
    (finding) => finding.status === "OPEN"
  ).length;

  const passedControls = controls.filter(
    (control) => control.status === "PASS"
  ).length;

  const severityStyle = {
    CRITICAL: "bg-red-500/10 text-red-400",
    HIGH: "bg-orange-500/10 text-orange-400",
    MEDIUM: "bg-amber-500/10 text-amber-400",
    LOW: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Security & Compliance
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Review security findings, compliance controls, and access risks.
          </p>
        </div>

        <button
          onClick={resetData}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCcw size={15} />
          Reset Demo Data
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            title: "Open Findings",
            value: openFindings,
            icon: ShieldAlert,
            color: "text-red-400",
          },
          {
            title: "Critical Findings",
            value: findings.filter(
              (finding) =>
                finding.severity === "CRITICAL" &&
                finding.status === "OPEN"
            ).length,
            icon: AlertTriangle,
            color: "text-orange-400",
          },
          {
            title: "Controls Passed",
            value: `${passedControls}/${controls.length}`,
            icon: CheckCircle,
            color: "text-emerald-400",
          },
          {
            title: "IAM Roles",
            value: "12",
            icon: Users,
            color: "text-blue-400",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{item.title}</p>
                <Icon size={20} className={item.color} />
              </div>

              <h3 className="mt-4 text-3xl font-bold text-white">
                {item.value}
              </h3>
            </div>
          );
        })}

      </div>

      {/* SECURITY FINDINGS */}
      <section className="rounded-xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 p-5">
          <h3 className="font-semibold text-white">
            Security Findings
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Review and track simulated infrastructure security issues.
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3 p-4">

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search findings..."
              className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto px-4 pb-4">

          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Finding ID</th>
                <th className="p-3">Finding</th>
                <th className="p-3">Resource</th>
                <th className="p-3">Service</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredFindings.map((finding) => (
                <tr
                  key={finding.id}
                  className="border-t border-slate-800"
                >
                  <td className="p-3 text-slate-500">
                    {finding.id}
                  </td>

                  <td className="p-3 font-medium text-white">
                    {finding.title}
                  </td>

                  <td className="p-3 text-slate-400">
                    {finding.resource}
                  </td>

                  <td className="p-3 text-slate-400">
                    {finding.service}
                  </td>

                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${severityStyle[finding.severity]}`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-xs ${
                        finding.status === "OPEN"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {finding.status}
                    </span>
                  </td>

                  <td className="p-3">
                    {finding.status === "OPEN" ? (
                      <button
                        onClick={() => resolveFinding(finding.id)}
                        className="rounded-lg border border-emerald-800 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredFindings.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              No matching security findings.
            </p>
          )}

        </div>
      </section>

      {/* COMPLIANCE CONTROLS */}
      <section className="rounded-xl border border-slate-800 bg-slate-900">

        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <ShieldCheck className="text-blue-400" size={21} />
          <div>
            <h3 className="font-semibold text-white">
              Compliance Controls
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Simulated security control assessment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">

          {controls.map((control) => (
            <div
              key={control.name}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {control.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {control.category}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  control.status === "PASS"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {control.status}
              </span>
            </div>
          ))}

        </div>
      </section>

      <p className="text-xs text-slate-500">
        Demo environment · Simulated security findings · No live AWS connection
      </p>

    </div>
  );
}