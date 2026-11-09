import { useEffect, useMemo, useState } from "react";
import {
  Network,
  Globe,
  Search,
  Activity,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import cloudControlAPI from "../services/api";

const tabs = [
  { name: "VPCs", icon: Network },
  { name: "Subnets", icon: Globe },
  { name: "Security Groups", icon: ShieldCheck },
  { name: "Internet Gateways", icon: Activity },
];

function getResourceName(tags, fallback) {
  return (
    tags?.find((tag) => tag.Key === "Name")?.Value ||
    fallback ||
    "Unnamed Resource"
  );
}

function NetworkingPage() {
  const [activeTab, setActiveTab] = useState("VPCs");
  const [search, setSearch] = useState("");

  const [vpcs, setVpcs] = useState([]);
  const [subnets, setSubnets] = useState([]);
  const [securityGroups, setSecurityGroups] = useState([]);
  const [internetGateways, setInternetGateways] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchNetworkingData() {
    try {
      setLoading(true);
      setError(null);

      const [
        vpcData,
        subnetData,
        securityGroupData,
        internetGatewayData,
      ] = await Promise.all([
        cloudControlAPI.getVPCs(),
        cloudControlAPI.getSubnets(),
        cloudControlAPI.getSecurityGroups(),
        cloudControlAPI.getInternetGateways(),
      ]);

      // VPCs
      setVpcs(
        (vpcData.vpcs || []).map((vpc) => ({
          id: vpc.vpc_id,
          name: getResourceName(vpc.tags, "Unnamed VPC"),
          details: vpc.cidr_block || "—",
          scope: "us-east-1",
          status: vpc.state || "Unknown",
        }))
      );

      // Subnets
      setSubnets(
        (subnetData.subnets || []).map((subnet) => ({
          id: subnet.subnet_id,
          name: getResourceName(subnet.tags, "Unnamed Subnet"),
          details: subnet.cidr_block || "—",
          scope: subnet.availability_zone || "—",
          status: subnet.state || "Unknown",
        }))
      );

      // Security Groups
      setSecurityGroups(
        (securityGroupData.security_groups || []).map((sg) => ({
          id: sg.group_id,
          name: sg.group_name || "Unnamed Security Group",
          details: `Inbound: ${sg.ingress_rules} | Outbound: ${sg.egress_rules}`,
          scope: sg.vpc_id || "—",
          status: "Active",
          description: sg.description,
        }))
      );

      // Internet Gateways
      setInternetGateways(
        (internetGatewayData.internet_gateways || []).map((gateway) => ({
          id: gateway.internet_gateway_id,
          name: getResourceName(
            gateway.tags,
            "Internet Gateway"
          ),
          details: gateway.vpc_id
            ? "Attached to VPC"
            : "Not attached",
          scope: gateway.vpc_id || "—",
          status: gateway.state || (gateway.vpc_id ? "Attached" : "Detached"),
        }))
      );
    } catch (err) {
      console.error("Networking API error:", err);
      setError(err.message || "Unable to fetch networking resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNetworkingData();
  }, []);

  const resourceMap = {
    VPCs: vpcs,
    Subnets: subnets,
    "Security Groups": securityGroups,
    "Internet Gateways": internetGateways,
  };

  const currentData = resourceMap[activeTab] || [];

  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    return currentData.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [currentData, search]);

  const totalResources =
    vpcs.length +
    subnets.length +
    securityGroups.length +
    internetGateways.length;

  const stats = [
    {
      title: "Total VPCs",
      value: vpcs.length,
      icon: Network,
    },
    {
      title: "Total Subnets",
      value: subnets.length,
      icon: Globe,
    },
    {
      title: "Security Groups",
      value: securityGroups.length,
      icon: ShieldCheck,
    },
    {
      title: "Network Resources",
      value: totalResources,
      icon: Activity,
    },
  ];

  function getStatusStyle(status) {
    const normalizedStatus = String(status).toLowerCase();

    if (
      normalizedStatus.includes("available") ||
      normalizedStatus.includes("active") ||
      normalizedStatus.includes("attached")
    ) {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (
      normalizedStatus.includes("detached") ||
      normalizedStatus.includes("inactive")
    ) {
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }

    return "border-slate-600 bg-slate-800 text-slate-300";
  }

  return (
    <div className="mt-6 space-y-7 text-slate-200">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Network Infrastructure
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Monitor your live AWS networking infrastructure.
          </p>
        </div>

        <button
          onClick={fetchNetworkingData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh AWS Data
        </button>
      </div>

      {/* Connection Status */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-300">
          Live AWS connection · Read-only networking inventory
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Networking API error: {error}
        </div>
      )}

      {/* Statistics */}
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

      {/* Resource Inventory */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Network Resource Inventory
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Explore your AWS networking infrastructure.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-500"
            />

            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 lg:w-64"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-7 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.name}
                onClick={() => {
                  setActiveTab(tab.name);
                  setSearch("");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition ${
                  activeTab === tab.name
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">

            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4">Resource ID</th>
                <th className="pb-4">Resource Name</th>
                <th className="pb-4">Network Details</th>
                <th className="pb-4">VPC / Region / AZ</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-800/70 text-sm transition hover:bg-slate-800/30"
                >
                  <td className="py-5 font-mono text-xs text-blue-400">
                    {item.id}
                  </td>

                  <td className="py-5 font-medium text-white">
                    <div>{item.name}</div>

                    {item.description && (
                      <div className="mt-1 max-w-[200px] truncate text-xs text-slate-500">
                        {item.description}
                      </div>
                    )}
                  </td>

                  <td className="py-5 text-slate-400">
                    {item.details}
                  </td>

                  <td className="py-5 font-mono text-xs text-slate-400">
                    {item.scope}
                  </td>

                  <td className="py-5">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          {/* Loading */}
          {loading && (
            <div className="py-12 text-center text-sm text-slate-400">
              Fetching live AWS networking data...
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredData.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              {currentData.length === 0
                ? `No ${activeTab} found in your AWS region.`
                : "No matching resources found."}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="py-12 text-center text-sm text-red-400">
              Unable to display networking resources.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredData.length} of {currentData.length} resources
          </span>

          <span className="flex items-center gap-2">
            <RefreshCw size={13} />
            Live AWS inventory
          </span>
        </div>

      </section>
    </div>
  );
}

export default NetworkingPage;