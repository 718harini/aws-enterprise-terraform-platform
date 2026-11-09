import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Users,
  Search,
  RefreshCcw,
  CheckCircle,
  User,
  KeyRound,
  AlertTriangle,
  FileText,
  Fingerprint,
  ShieldAlert,
} from "lucide-react";

import cloudControlAPI from "../services/api";

const tabs = [
  "Users",
  "Roles",
  "MFA Audit",
  "Access Keys",
  "Credential Report",
  "Policy Audit",
];

function getArray(data, keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function StatusBadge({ status }) {
  const value = String(status ?? "Unknown").toLowerCase();

  let style = "bg-slate-500/10 text-slate-400";
  let label = status ?? "Unknown";

  if (
    value.includes("high") ||
    value.includes("required") ||
    value.includes("disabled") ||
    value.includes("inactive") ||
    value.includes("not enabled") ||
    value.includes("no mfa")
  ) {
    style = "bg-red-500/10 text-red-400";
  } else if (
    value.includes("medium") ||
    value.includes("warning") ||
    value.includes("rotation")
  ) {
    style = "bg-amber-500/10 text-amber-400";
  } else if (
    value.includes("enabled") ||
    value.includes("active") ||
    value.includes("compliant") ||
    value.includes("retrieved") ||
    value.includes("low")
  ) {
    style = "bg-emerald-500/10 text-emerald-400";
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${style}`}>
      {String(label)}
    </span>
  );
}

function AuditTable({ columns, rows, loading, emptyMessage }) {
  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="p-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id || row.user_id || row.username || index}
              className="border-t border-slate-800 hover:bg-slate-800/30"
            >
              {columns.map((column) => {
                const value = row[column.key];

                return (
                  <td
                    key={column.key}
                    className="max-w-[350px] truncate p-3 text-slate-300"
                  >
                    {column.status ? (
                      <StatusBadge status={value} />
                    ) : (
                      value === null || value === undefined || value === ""
                        ? "Not available"
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {loading && (
        <div className="py-12 text-center text-sm text-slate-400">
          Loading live AWS security data...
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default function SecurityPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [mfaData, setMfaData] = useState({});
  const [accessKeyData, setAccessKeyData] = useState({});
  const [credentialData, setCredentialData] = useState({});
  const [policyData, setPolicyData] = useState({});

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Users");

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchSecurityData = async () => {
    setLoading(true);
    setErrors({});

    const endpoints = [
      ["iam", cloudControlAPI.getIAMSummary],
      ["mfa", cloudControlAPI.getMFAAudit],
      ["accessKeys", cloudControlAPI.getAccessKeys],
      ["credential", cloudControlAPI.getCredentialReport],
      ["policy", cloudControlAPI.getPolicyAudit],
    ];

    const results = await Promise.allSettled(
      endpoints.map(([, request]) => request())
    );

    const failed = {};

    results.forEach((result, index) => {
      const key = endpoints[index][0];

      if (result.status === "rejected") {
        failed[key] =
          result.reason?.message || "Unable to retrieve AWS data.";
        return;
      }

      const data = result.value || {};

      if (key === "iam") {
        const userList = getArray(data, ["users", "iam_users"]);
        const roleList = getArray(data, ["roles", "iam_roles"]);

        setUsers(
          userList.map((user, index) => ({
            id: user.user_id || user.UserId || `user-${index}`,
            name:
              user.username ||
              user.user_name ||
              user.name ||
              user.UserName ||
              "Unknown",
            arn: user.arn || user.Arn || "Not available",
            created:
              user.created ||
              user.create_date ||
              user.CreateDate ||
              null,
          }))
        );

        setRoles(
          roleList.map((role, index) => ({
            id: role.role_id || role.RoleId || `role-${index}`,
            name:
              role.role_name ||
              role.name ||
              role.RoleName ||
              "Unknown",
            arn: role.arn || role.Arn || "Not available",
            created:
              role.created ||
              role.create_date ||
              role.CreateDate ||
              null,
          }))
        );
      }

      if (key === "mfa") setMfaData(data);
      if (key === "accessKeys") setAccessKeyData(data);
      if (key === "credential") setCredentialData(data);
      if (key === "policy") setPolicyData(data);
    });

    setErrors(failed);
    setLoading(false);
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Not available"
      : parsedDate.toLocaleDateString();
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.name} ${user.arn}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [users, search]
  );

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) =>
        `${role.name} ${role.arn}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [roles, search]
  );

  // MFA DATA

  const mfaRows = getArray(mfaData, [
    "users",
    "mfa_users",
    "results",
    "findings",
  ]).map((item, index) => ({
    id: item.user_id || item.username || index,
    username:
      item.username ||
      item.user_name ||
      item.UserName ||
      "Unknown",
    mfa:
      item.mfa_enabled ??
      item.mfa_status ??
      item.has_mfa ??
      item.status ??
      "Unknown",
    devices:
      item.mfa_devices ??
      item.device_count ??
      item.devices?.length ??
      0,
  }));

  // ACCESS KEY DATA

  const accessKeyRows = getArray(accessKeyData, [
    "access_keys",
    "keys",
    "users",
    "results",
  ]).flatMap((item, index) => {
    if (item.access_key_id || item.AccessKeyId) {
      return [{
        id: item.access_key_id || item.AccessKeyId,
        username: item.username || item.user_name || "Unknown",
        keyId: item.access_key_id || item.AccessKeyId,
        status: item.status || item.Status || "Unknown",
        age: item.age_days ?? item.key_age_days ?? "Unknown",
        rotation: item.rotation_required ? "Required" : "Not required",
      }];
    }

    const keys = item.access_keys || item.keys || [];

    return keys.map((key, keyIndex) => ({
      id: `${index}-${keyIndex}`,
      username: item.username || item.user_name || "Unknown",
      keyId: key.access_key_id || key.AccessKeyId || "Not available",
      status: key.status || key.Status || "Unknown",
      age: key.age_days ?? key.key_age_days ?? "Unknown",
      rotation: key.rotation_required ? "Required" : "Not required",
    }));
  });

  // CREDENTIAL REPORT

  const credentialRows = getArray(credentialData, [
    "users",
    "report",
    "credentials",
    "results",
  ]).map((item, index) => ({
    id: item.user || item.user_name || index,
    user: item.user || item.user_name || item.UserName || "Unknown",
    password:
      item.password_enabled ||
      item.password_status ||
      item.password_active ||
      "Unknown",
    mfa: item.mfa_active ?? item.mfa_enabled ?? "Unknown",
    accessKey1:
      item.access_key_1_active ?? item.access_key_1_status ?? "Unknown",
    accessKey2:
      item.access_key_2_active ?? item.access_key_2_status ?? "Unknown",
  }));

  // POLICY AUDIT

  const policyRows = getArray(policyData, [
    "findings",
    "policies",
    "results",
  ]).map((item, index) => ({
    id: item.policy_arn || item.policy_name || index,
    policy:
      item.policy_name ||
      item.name ||
      item.PolicyName ||
      "Unknown policy",
    identity:
      item.username ||
      item.role_name ||
      item.identity ||
      "Not specified",
    finding:
      item.finding ||
      item.issue ||
      item.message ||
      item.description ||
      "Policy finding",
    severity: item.severity || "Unknown",
  }));

  const policyHigh = policyRows.filter(
    (item) => item.severity.toLowerCase() === "high"
  ).length;

  const policyMedium = policyRows.filter(
    (item) => item.severity.toLowerCase() === "medium"
  ).length;

  const mfaCoverage =
    mfaData.coverage_percentage ??
    mfaData.mfa_coverage ??
    mfaData.coverage ??
    "N/A";

  const stats = [
    {
      title: "IAM Users",
      value: users.length,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "IAM Roles",
      value: roles.length,
      icon: KeyRound,
      color: "text-purple-400",
    },
    {
      title: "MFA Coverage",
      value:
        typeof mfaCoverage === "number"
          ? `${mfaCoverage}%`
          : mfaCoverage,
      icon: Fingerprint,
      color: "text-emerald-400",
    },
    {
      title: "Policy Findings",
      value: policyRows.length,
      icon: ShieldAlert,
      color: "text-amber-400",
    },
  ];

  const errorKey = {
    Users: "iam",
    Roles: "iam",
    "MFA Audit": "mfa",
    "Access Keys": "accessKeys",
    "Credential Report": "credential",
    "Policy Audit": "policy",
  }[activeTab];

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Security & Identity Management
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Monitor IAM identities, MFA, credentials and security policies.
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCcw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* LIVE NOTICE */}

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-300">
          Live AWS Security Audit · Read-only connection
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Security data is retrieved directly from AWS IAM APIs.
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {item.title}
                </p>

                <Icon size={20} className={item.color} />
              </div>

              <h3 className="mt-4 text-3xl font-bold text-white">
                {loading ? "..." : item.value}
              </h3>
            </div>
          );
        })}
      </div>

      {/* SECURITY INVENTORY */}

      <section className="rounded-xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 p-5">
          <h3 className="font-semibold text-white">
            Security Audit & Identity Inventory
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Live AWS security information and audit findings.
          </p>
        </div>

        {/* TABS */}

        <div className="flex flex-wrap gap-2 border-b border-slate-800 p-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
              }}
              className={`rounded-lg px-3 py-2 text-xs sm:text-sm ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SEARCH */}

        {["Users", "Roles"].includes(activeTab) && (
          <div className="border-b border-slate-800 p-4">
            <div className="relative ml-auto w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search IAM identities..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* SECTION ERROR */}

        {errors[errorKey] && (
          <div className="m-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
            <AlertTriangle size={15} className="mr-2 inline" />
            {errors[errorKey]}
          </div>
        )}

        {/* USERS */}

        {activeTab === "Users" && (
          <AuditTable
            loading={loading}
            emptyMessage="No IAM users found."
            rows={filteredUsers.map((user) => ({
              ...user,
              created: formatDate(user.created),
              type: "IAM User",
              status: "Retrieved",
            }))}
            columns={[
              { key: "name", label: "User Name" },
              { key: "arn", label: "ARN" },
              { key: "created", label: "Created" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status", status: true },
            ]}
          />
        )}

        {/* ROLES */}

        {activeTab === "Roles" && (
          <AuditTable
            loading={loading}
            emptyMessage="No IAM roles found."
            rows={filteredRoles.map((role) => ({
              ...role,
              created: formatDate(role.created),
              type: "IAM Role",
              status: "Retrieved",
            }))}
            columns={[
              { key: "name", label: "Role Name" },
              { key: "arn", label: "ARN" },
              { key: "created", label: "Created" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status", status: true },
            ]}
          />
        )}

        {/* MFA AUDIT */}

        {activeTab === "MFA Audit" && (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-400">MFA Coverage</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {mfaCoverage}
                  {typeof mfaCoverage === "number" ? "%" : ""}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-400">Users Audited</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {mfaData.total_users ?? mfaRows.length}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-400">MFA Findings</p>
                <p className="mt-2 text-2xl font-bold text-amber-400">
                  {mfaData.users_without_mfa ??
                    mfaData.users_without_mfa_count ??
                    "N/A"}
                </p>
              </div>
            </div>

            <AuditTable
              loading={loading}
              emptyMessage="No MFA audit records returned."
              rows={mfaRows}
              columns={[
                { key: "username", label: "IAM User" },
                { key: "mfa", label: "MFA Status", status: true },
                { key: "devices", label: "MFA Devices" },
              ]}
            />
          </>
        )}

        {/* ACCESS KEYS */}

        {activeTab === "Access Keys" && (
          <>
            <div className="p-4 text-sm text-slate-400">
              Access keys older than 90 days are flagged for rotation.
            </div>

            <AuditTable
              loading={loading}
              emptyMessage="No access key records returned."
              rows={accessKeyRows}
              columns={[
                { key: "username", label: "IAM User" },
                { key: "keyId", label: "Access Key ID" },
                { key: "status", label: "Key Status", status: true },
                { key: "age", label: "Age (Days)" },
                { key: "rotation", label: "Rotation", status: true },
              ]}
            />
          </>
        )}

        {/* CREDENTIAL REPORT */}

        {activeTab === "Credential Report" && (
          <>
            <div className="flex items-center gap-2 p-4 text-sm text-slate-400">
              <FileText size={18} className="text-blue-400" />
              AWS IAM credential report
            </div>

            <AuditTable
              loading={loading}
              emptyMessage={
                credentialData.message ||
                "No credential report records returned."
              }
              rows={credentialRows}
              columns={[
                { key: "user", label: "User" },
                { key: "password", label: "Password Status", status: true },
                { key: "mfa", label: "MFA", status: true },
                { key: "accessKey1", label: "Access Key 1", status: true },
                { key: "accessKey2", label: "Access Key 2", status: true },
              ]}
            />
          </>
        )}

        {/* POLICY AUDIT */}

        {activeTab === "Policy Audit" && (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-400">
                  Policies Scanned
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {policyData.total_policies_scanned ?? "N/A"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-400">
                  High Severity
                </p>
                <p className="mt-2 text-2xl font-bold text-red-400">
                  {policyHigh}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-400">
                  Medium Severity
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-400">
                  {policyMedium}
                </p>
              </div>
            </div>

            <AuditTable
              loading={loading}
              emptyMessage="No policy findings returned."
              rows={policyRows}
              columns={[
                { key: "policy", label: "Policy" },
                { key: "identity", label: "Attached Identity" },
                { key: "finding", label: "Finding" },
                { key: "severity", label: "Severity", status: true },
              ]}
            />
          </>
        )}

        {/* FOOTER */}

        <div className="flex flex-wrap justify-between gap-2 border-t border-slate-800 p-4 text-xs text-slate-500">
          <span>{activeTab}</span>

          <span className="flex items-center gap-2">
            <ShieldCheck size={14} />
            AWS Security Monitoring
          </span>
        </div>
      </section>

      {/* SECURITY NOTE */}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs text-slate-400">
          <ShieldCheck
            size={14}
            className="mr-2 inline text-blue-400"
          />
          This dashboard performs read-only security assessments. Policy
          findings are indicators based on the implemented wildcard-policy
          checks, not a complete evaluation of effective AWS permissions.
          Review findings before taking corrective action.
        </p>
      </div>

    </div>
  );
}