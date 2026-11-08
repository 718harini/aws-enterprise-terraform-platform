import { useState } from "react";
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

const initialAlarms = [
  {
    name: "High-CPU-EC2",
    resource: "i-0a1234567890",
    metric: "CPU Utilization",
    threshold: "> 80%",
    value: "24.5%",
    status: "OK",
  },
  {
    name: "High-Memory-Usage",
    resource: "Web-Server-01",
    metric: "Memory Usage",
    threshold: "> 85%",
    value: "91.2%",
    status: "ALARM",
  },
  {
    name: "Database-Connections",
    resource: "Production-RDS",
    metric: "DB Connections",
    threshold: "> 100",
    value: "42",
    status: "OK",
  },
];

const initialLogs = [
  {
    time: "00:02:15",
    service: "EC2",
    level: "INFO",
    message: "Instance health check passed",
  },
  {
    time: "00:01:42",
    service: "Lambda",
    level: "ERROR",
    message: "Function execution timeout",
  },
  {
    time: "23:59:30",
    service: "RDS",
    level: "INFO",
    message: "Database backup completed",
  },
  {
    time: "23:57:12",
    service: "CloudTrail",
    level: "WARNING",
    message: "Unusual API activity detected",
  },
];

export default function MonitoringPage() {
  const [alarms, setAlarms] = useState(initialAlarms);
  const [logs] = useState(initialLogs);
  const [activeTab, setActiveTab] = useState("Alarms");
  const [search, setSearch] = useState("");

  const filteredAlarms = alarms.filter((alarm) =>
    `${alarm.name} ${alarm.resource} ${alarm.metric}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter((log) =>
    `${log.service} ${log.level} ${log.message}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const resetData = () => {
    setAlarms(initialAlarms);
    setSearch("");
    setActiveTab("Alarms");
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
            Monitor metrics, alarms, and application logs.
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

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            title: "Monitored Resources",
            value: "24",
            icon: Server,
            color: "text-blue-400",
          },
          {
            title: "Active Alarms",
            value: alarms.filter((a) => a.status === "ALARM").length,
            icon: AlertTriangle,
            color: "text-red-400",
          },
          {
            title: "Healthy Checks",
            value: "18",
            icon: CheckCircle,
            color: "text-emerald-400",
          },
          {
            title: "Log Events",
            value: logs.length,
            icon: FileText,
            color: "text-purple-400",
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
            <table className="w-full min-w-[700px] text-left text-sm">
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
                  <tr key={alarm.name} className="border-t border-slate-800">
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
                          alarm.status === "OK"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {alarm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* LOGS */}
          {activeTab === "Logs" && (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
                >
                  <Clock size={17} className="text-slate-500" />

                  <span className="text-xs text-slate-500">
                    {log.time}
                  </span>

                  <span className="text-sm font-medium text-white">
                    {log.service}
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      log.level === "ERROR"
                        ? "text-red-400"
                        : log.level === "WARNING"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="text-sm text-slate-400">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* METRICS */}
          {activeTab === "Metrics" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ["CPU Utilization", "24.5%", "Normal"],
                ["Memory Usage", "68.2%", "Normal"],
                ["Network Traffic", "128 MB/s", "Normal"],
                ["Disk Usage", "72.4%", "Normal"],
                ["Database Connections", "42", "Normal"],
                ["Lambda Invocations", "1,284", "Normal"],
              ].map(([name, value, status]) => (
                <div
                  key={name}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex items-center justify-between">
                    <Activity size={18} className="text-blue-400" />
                    <span className="text-xs text-emerald-400">
                      {status}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-slate-400">{name}</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {value}
                  </h3>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Alarms" && filteredAlarms.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              No matching alarms found.
            </p>
          )}

          {activeTab === "Logs" && filteredLogs.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              No matching logs found.
            </p>
          )}

        </div>
      </div>

      <p className="text-xs text-slate-500">
        Demo environment · Simulated monitoring data · No live AWS connection
      </p>

    </div>
  );
}