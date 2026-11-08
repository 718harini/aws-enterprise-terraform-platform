import { useMemo, useState } from "react";
import {
  Network,
  Globe,
  ShieldCheck,
  Router,
  Search,
  Activity,
  RefreshCw,
} from "lucide-react";

const networkingData = {
  VPCs: [
    {
      id: "vpc-0a12bc34",
      name: "production-vpc",
      cidr: "10.0.0.0/16",
      region: "us-east-1",
      status: "Available",
    },
    {
      id: "vpc-0b23cd45",
      name: "development-vpc",
      cidr: "10.1.0.0/16",
      region: "us-east-1",
      status: "Available",
    },
    {
      id: "vpc-0c34de56",
      name: "testing-vpc",
      cidr: "172.16.0.0/16",
      region: "ap-south-1",
      status: "Available",
    },
  ],

  Subnets: [
    {
      id: "subnet-0123abcd",
      name: "public-subnet-1",
      cidr: "10.0.1.0/24",
      region: "us-east-1a",
      status: "Available",
    },
    {
      id: "subnet-0234bcde",
      name: "private-subnet-1",
      cidr: "10.0.2.0/24",
      region: "us-east-1b",
      status: "Available",
    },
    {
      id: "subnet-0345cdef",
      name: "public-subnet-2",
      cidr: "10.0.3.0/24",
      region: "us-east-1c",
      status: "Available",
    },
  ],

  "Security Groups": [
    {
      id: "sg-0123abcd",
      name: "web-server-sg",
      cidr: "HTTP / HTTPS",
      region: "production-vpc",
      status: "Active",
    },
    {
      id: "sg-0234bcde",
      name: "database-sg",
      cidr: "MySQL 3306",
      region: "production-vpc",
      status: "Active",
    },
    {
      id: "sg-0345cdef",
      name: "application-sg",
      cidr: "Application traffic",
      region: "development-vpc",
      status: "Active",
    },
  ],

  "Internet Gateways": [
    {
      id: "igw-0123abcd",
      name: "production-igw",
      cidr: "production-vpc",
      region: "us-east-1",
      status: "Attached",
    },
    {
      id: "igw-0234bcde",
      name: "development-igw",
      cidr: "development-vpc",
      region: "us-east-1",
      status: "Attached",
    },
  ],
};

const tabs = [
  { name: "VPCs", icon: Network },
  { name: "Subnets", icon: Globe },
  { name: "Security Groups", icon: ShieldCheck },
  { name: "Internet Gateways", icon: Router },
];

function NetworkingPage() {
  const [activeTab, setActiveTab] = useState("VPCs");
  const [search, setSearch] = useState("");

  const currentData = networkingData[activeTab];

  const filteredData = useMemo(() => {
    return currentData.filter((item) =>
      Object.values(item).some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [currentData, search]);

  const totalResources = Object.values(networkingData).reduce(
    (total, items) => total + items.length,
    0
  );

  const stats = [
    {
      title: "Total VPCs",
      value: networkingData.VPCs.length,
      icon: Network,
    },
    {
      title: "Total Subnets",
      value: networkingData.Subnets.length,
      icon: Globe,
    },
    {
      title: "Security Groups",
      value: networkingData["Security Groups"].length,
      icon: ShieldCheck,
    },
    {
      title: "Total Resources",
      value: totalResources,
      icon: Activity,
    },
  ];

  return (
    <div className="mt-6 space-y-7">

      {/* DEMO NOTICE */}

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-blue-300">
          Networking inventory · Demonstration data · No live AWS connection
        </p>
      </div>

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

              <h3 className="mt-5 text-3xl font-bold text-white">
                {stat.value}
              </h3>
            </div>
          );
        })}
      </section>

      {/* NETWORK RESOURCE INVENTORY */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

          <div>
            <h3 className="text-xl font-semibold text-white">
              Network Resource Inventory
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Explore and monitor your network infrastructure.
            </p>
          </div>

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

        {/* TABS */}

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

        {/* TABLE */}

        <div className="mt-6 overflow-x-auto">

          <table className="w-full min-w-[650px] text-left">

            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4">Resource ID</th>
                <th className="pb-4">Resource Name</th>
                <th className="pb-4">CIDR / Configuration</th>
                <th className="pb-4">Region / VPC</th>
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
                    {item.name}
                  </td>

                  <td className="py-5 text-slate-400">
                    {item.cidr}
                  </td>

                  <td className="py-5 text-slate-400">
                    {item.region}
                  </td>

                  <td className="py-5">
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                      {item.status}
                    </span>
                  </td>
                </tr>

              ))}

            </tbody>

          </table>

          {filteredData.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching resources found.
            </div>
          )}

        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredData.length} of {currentData.length} resources
          </span>

          <span className="flex items-center gap-2">
            <RefreshCw size={13} />
            Demo inventory
          </span>
        </div>

      </section>

    </div>
  );
}

export default NetworkingPage;