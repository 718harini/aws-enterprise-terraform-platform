import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Search,
  RefreshCcw,
  FileText,
} from "lucide-react";

import cloudControlAPI from "../services/api";

export default function MonitoringPage() {
  const [alarms, setAlarms] = useState([]);
  const [instances, setInstances] = useState([]);
  const [cpuMetrics, setCpuMetrics] = useState([]);
  const [logGroups, setLogGroups] = useState([]);

  const [activeTab, setActiveTab] = useState("Alarms");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [alarmData, instanceData, logData] = await Promise.all([
        cloudControlAPI.getAlarms(),
        cloudControlAPI.getEC2Instances(),
        cloudControlAPI.getLogGroups(),
      ]);

      // ALARMS

      const alarmList = alarmData.alarms || [];

      const formattedAlarms = alarmList.map((alarm, index) => {
        const dimensions = alarm.dimensions || alarm.Dimensions || [];

        const instanceDimension = dimensions.find(
          (dimension) =>
            dimension.Name === "InstanceId" ||
            dimension.name === "InstanceId"
        );

        return {
          id: alarm.alarm_name || alarm.name || `alarm-${index}`,
          name: alarm.alarm_name || alarm.name || "Unnamed alarm",
          resource:
            instanceDimension?.Value ||
            instanceDimension?.value ||
            alarm.resource ||
            "Not specified",
          metric: alarm.metric_name || alarm.metric || "Not specified",
          threshold:
            alarm.threshold !== undefined
              ? alarm.threshold
              : "Not specified",
          value:
            alarm.current_value !== undefined
              ? alarm.current_value
              : "Not available",
          status: alarm.state_value || alarm.state || "UNKNOWN",
          description:
            alarm.alarm_description ||
            alarm.description ||
            "No description",
        };
      });

      // EC2 INSTANCES

      const instanceList = instanceData.instances || [];

      // CLOUDWATCH LOG GROUPS

      const logGroupList = logData.log_groups || [];

      setAlarms(formattedAlarms);
      setInstances(instanceList);
      setLogGroups(logGroupList);

      // EC2 CPU METRICS

      const runningInstances = instanceList.filter(
        (instance) =>
          instance.state?.toLowerCase() === "running"
      );

      const metricResults = await Promise.all(
        runningInstances.map(async (instance) => {
          try {
            const result = await cloudControlAPI.getEC2CPUMetrics(
              instance.instance_id
            );

            const points =
              result.datapoints ||
              result.data_points ||
              [];

            const latestPoint = [...points].sort(
              (a, b) =>
                new Date(b.timestamp || b.Timestamp) -
                new Date(a.timestamp || a.Timestamp)
            )[0];

            return {
              id: instance.instance_id,
              name: instance.name || instance.instance_id,
              cpu:
                latestPoint?.average ??
                latestPoint?.Average ??
                latestPoint?.maximum ??
                latestPoint?.Maximum ??
                null,
              timestamp:
                latestPoint?.timestamp ||
                latestPoint?.Timestamp ||
                null,
            };
          } catch (metricError) {
            console.error(
              `CPU metrics failed for ${instance.instance_id}:`,
              metricError
            );

            return {
              id: instance.instance_id,
              name: instance.name || instance.instance_id,
              cpu: null,
              timestamp: null,
            };
          }
        })
      );

      setCpuMetrics(metricResults);
    } catch (err) {
      console.error("Monitoring API error:", err);
      setError(err.message || "Unable to load monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  // SEARCH FILTERS

  const filteredAlarms = alarms.filter((alarm) =>
    `${alarm.name} ${alarm.resource} ${alarm.metric} ${alarm.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredMetrics = cpuMetrics.filter((metric) =>
    `${metric.name} ${metric.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredLogGroups = logGroups.filter((group) =>
    `${group.log_group_name} ${group.kms_key_id || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // STATISTICS

  const alarmCount = alarms.filter(
    (alarm) => alarm.status.toUpperCase() === "ALARM"
  ).length;

  const healthyCount = alarms.filter(
    (alarm) => alarm.status.toUpperCase() === "OK"
  ).length;

  const stats = [
    {
      title: "EC2 Instances",
      value: instances.length,
      icon: Server,
      color: "text-blue-400",
    },
    {
      title: "Active Alarms",
      value: alarmCount,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "Healthy Alarms",
      value: healthyCount,
      icon: CheckCircle,
      color: "text-emerald-400",
    },
    {
      title: "CloudWatch Alarms",
      value: alarms.length,
      icon: FileText,
      color: "text-purple-400",
    },
  ];

  // FORMAT LOG GROUP CREATION TIME

  const formatCreationTime = (timestamp) => {
    if (!timestamp) return "Not available";

    return new Date(Number(timestamp)).toLocaleString();
  };

  // FORMAT STORAGE SIZE

  const formatStorage = (bytes) => {
    if (!bytes || Number(bytes) === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${
      units[index]
    }`;
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Infrastructure Monitoring
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Live AWS CloudWatch alarms, logs and EC2 performance metrics.
          </p>
        </div>

        <button
          onClick={fetchMonitoringData}
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
          Live AWS Monitoring · Read-only connection · Region: us-east-1
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* METRIC CARDS */}

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

      {/* MONITORING TABS */}

      <div className="rounded-xl border border-slate-800 bg-slate-900">

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 p-4">

          {["Alarms", "Logs", "Metrics"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
              }}
              className={`rounded-lg px-4 py-2 text-sm ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}

          <div className="relative ml-auto">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-48 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

        </div>

        <div className="overflow-x-auto p-4">

          {/* ALARMS */}

          {activeTab === "Alarms" && (
            <>
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Alarm Name</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">Metric</th>
                    <th className="p-3">Threshold</th>
                    <th className="p-3">Current Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAlarms.map((alarm) => (
                    <tr
                      key={alarm.id}
                      className="border-t border-slate-800"
                    >
                      <td className="p-3 font-medium text-white">
                        {alarm.name}
                      </td>

                      <td className="p-3 text-slate-400">
                        {alarm.resource}
                      </td>

                      <td className="p-3 text-slate-400">
                        {alarm.metric}
                      </td>

                      <td className="p-3 text-slate-400">
                        {alarm.threshold}
                      </td>

                      <td className="p-3 text-slate-300">
                        {alarm.value}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            alarm.status.toUpperCase() === "OK"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : alarm.status.toUpperCase() === "ALARM"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {alarm.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredAlarms.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500">
                  No CloudWatch alarms found.
                </p>
              )}
            </>
          )}

          {/* LOGS */}

          {activeTab === "Logs" && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    CloudWatch Log Groups
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Live log group inventory from AWS CloudWatch.
                  </p>
                </div>

                <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
                  {loading ? "Loading..." : `${logGroups.length} Log Groups`}
                </span>
              </div>

              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Log Group Name</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Retention</th>
                    <th className="p-3">Stored Size</th>
                    <th className="p-3">Encryption</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogGroups.map((group) => (
                    <tr
                      key={group.log_group_name}
                      className="border-t border-slate-800"
                    >
                      <td className="p-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <FileText
                            size={16}
                            className="text-blue-400"
                          />
                          {group.log_group_name}
                        </div>
                      </td>

                      <td className="p-3 text-slate-400">
                        {formatCreationTime(group.creation_time)}
                      </td>

                      <td className="p-3 text-slate-400">
                        {group.retention_in_days
                          ? `${group.retention_in_days} days`
                          : "Never expire"}
                      </td>

                      <td className="p-3 text-slate-400">
                        {formatStorage(group.stored_bytes)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            group.kms_key_id
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {group.kms_key_id
                            ? "KMS Encrypted"
                            : "Default Encryption"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredLogGroups.length === 0 && (
                <div className="py-10 text-center">
                  <FileText
                    size={35}
                    className="mx-auto mb-3 text-slate-600"
                  />

                  <h3 className="font-medium text-white">
                    No log groups found
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    No CloudWatch log groups match your search.
                  </p>
                </div>
              )}
            </>
          )}

          {/* METRICS */}

          {activeTab === "Metrics" && (
            <>
              <div className="mb-5 flex items-center gap-2 text-sm text-slate-400">
                <Activity size={17} className="text-blue-400" />
                EC2 CPU Utilization · CloudWatch
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <Server
                        size={18}
                        className="text-blue-400"
                      />

                      <span className="text-xs text-slate-500">
                        {metric.id}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-slate-400">
                      {metric.name}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {metric.cpu !== null
                        ? `${Number(metric.cpu).toFixed(2)}%`
                        : "No datapoints"}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                      {metric.timestamp
                        ? `Last datapoint: ${new Date(
                            metric.timestamp
                          ).toLocaleString()}`
                        : "No recent CPU datapoint returned"}
                    </p>
                  </div>
                ))}
              </div>

              {!loading && filteredMetrics.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">
                  No running EC2 instances available for CPU monitoring.
                </p>
              )}
            </>
          )}

        </div>
      </div>

      {/* FOOTER */}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock size={14} />
        Live AWS data · CloudWatch Alarms · Logs · EC2 Metrics
      </div>

    </div>
  );
}