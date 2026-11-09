import { useEffect, useMemo, useState } from "react";

import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  Server,
  Database,
  HardDrive,
  RefreshCcw,
  PiggyBank,
  Cloud,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import cloudControlAPI from "../services/api";

const recommendations = [
  {
    id: 1,
    title: "Review EC2 resource utilization",
    description:
      "Check CPU utilization and instance usage before choosing smaller instance types or stopping unused resources.",
    service: "EC2",
    priority: "HIGH",
  },
  {
    id: 2,
    title: "Review S3 storage lifecycle policies",
    description:
      "Identify infrequently accessed objects and consider appropriate lifecycle transitions.",
    service: "S3",
    priority: "MEDIUM",
  },
  {
    id: 3,
    title: "Review RDS instance sizing",
    description:
      "Compare database utilization with allocated instance capacity.",
    service: "RDS",
    priority: "HIGH",
  },
  {
    id: 4,
    title: "Review CloudWatch log retention",
    description:
      "Check log group retention settings to avoid unnecessary log storage costs.",
    service: "CloudWatch",
    priority: "LOW",
  },
];

const getServiceIcon = (service) => {
  const name = service.toLowerCase();

  if (name.includes("ec2") || name.includes("compute")) {
    return Server;
  }

  if (name.includes("database") || name.includes("rds")) {
    return Database;
  }

  if (name.includes("storage") || name.includes("s3")) {
    return HardDrive;
  }

  if (name.includes("cloudwatch")) {
    return TrendingUp;
  }

  return Cloud;
};

export default function CostOptimizationPage() {
  const [costData, setCostData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [budget, setBudget] = useState(300);
  const [budgetInput, setBudgetInput] = useState("300");

  const [reviewedItems, setReviewedItems] = useState([]);

  // Fetch actual AWS Cost Explorer data
  const fetchCosts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await cloudControlAPI.getCostSummary();

      setCostData(response);
    } catch (err) {
      console.error("Cost Explorer error:", err);
      setError(
        "Unable to retrieve AWS cost information. Check your backend and AWS permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  // Aggregate daily AWS costs by service
  const costs = useMemo(() => {
    if (!costData?.results) {
      return [];
    }

    const serviceTotals = {};

    costData.results.forEach((day) => {
      (day.Groups || []).forEach((group) => {
        const service = group.Keys?.[0] || "Unknown";

        const amount = Number(
          group.Metrics?.UnblendedCost?.Amount || 0
        );

        serviceTotals[service] =
          (serviceTotals[service] || 0) + amount;
      });
    });

    return Object.entries(serviceTotals)
      .map(([service, amount]) => ({
        service,
        amount,
        percentage: 0,
        icon: getServiceIcon(service),
      }))
      .filter((item) => item.amount > 0.000001)
      .sort((a, b) => b.amount - a.amount);
  }, [costData]);

  // Calculate total actual spending
  const totalCost = useMemo(() => {
    return costs.reduce(
      (total, item) => total + item.amount,
      0
    );
  }, [costs]);

  // Calculate percentages
  const serviceCosts = useMemo(() => {
    return costs.map((item) => ({
      ...item,
      percentage:
        totalCost > 0
          ? (item.amount / totalCost) * 100
          : 0,
    }));
  }, [costs, totalCost]);

  const currency = costData?.currency || "USD";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const budgetUsage =
    budget > 0 ? (totalCost / budget) * 100 : 0;

  const periodStart = costData?.period?.start;
  const periodEnd = costData?.period?.end;

  const estimatedData = costData?.results?.some(
    (day) => day.Estimated === true
  );

  const servicesTracked = costs.length;

  // Mark a recommendation as reviewed
  const markReviewed = (id) => {
    setReviewedItems((previous) =>
      previous.includes(id)
        ? previous
        : [...previous, id]
    );
  };

  // Update budget
  const updateBudget = (event) => {
    event.preventDefault();

    const value = Number(budgetInput);

    if (Number.isFinite(value) && value > 0) {
      setBudget(value);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCcw
            size={30}
            className="mx-auto animate-spin text-blue-400"
          />

          <p className="mt-4 text-sm text-slate-400">
            Retrieving AWS Cost Explorer data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-400" size={24} />

          <div>
            <h3 className="font-semibold text-white">
              Cost Data Unavailable
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={fetchCosts}
          className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
        >
          <RefreshCcw size={15} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Cost Optimization
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Monitor actual AWS spending and review optimization opportunities.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Billing period: {periodStart} to {periodEnd}
          </p>
        </div>

        <button
          onClick={fetchCosts}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCcw size={15} />
          Refresh Data
        </button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            title: "Actual AWS Spending",
            value: formatCurrency(totalCost),
            icon: DollarSign,
            color: "text-blue-400",
          },
          {
            title: "Configured Budget",
            value: formatCurrency(budget),
            icon: PiggyBank,
            color: "text-purple-400",
          },
          {
            title: "Services with Spend",
            value: servicesTracked,
            icon: Cloud,
            color: "text-emerald-400",
          },
          {
            title: "Budget Utilization",
            value: `${budgetUsage.toFixed(2)}%`,
            icon: TrendingUp,
            color:
              budgetUsage > 100
                ? "text-red-400"
                : "text-amber-400",
          },
        ].map((item) => {
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
                {item.value}
              </h3>
            </div>
          );
        })}

      </div>

      {/* BUDGET TRACKING */}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">
              Budget Tracking
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Compare actual AWS spending with your configured budget.
            </p>
          </div>

          <form
            onSubmit={updateBudget}
            className="flex gap-2"
          >
            <span className="flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-400">
              $
            </span>

            <input
              type="number"
              min="1"
              step="1"
              value={budgetInput}
              onChange={(event) =>
                setBudgetInput(event.target.value)
              }
              className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
            >
              Update
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Period spending
          </span>

          <span className="font-semibold text-white">
            {formatCurrency(totalCost)} / {formatCurrency(budget)}
          </span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              budgetUsage > 100
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{
              width: `${Math.min(budgetUsage, 100)}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {budgetUsage > 100
            ? "Spending has exceeded your configured budget."
            : `${(100 - budgetUsage).toFixed(2)}% of your configured budget remains.`}
        </p>

      </section>

      {/* SERVICE COST BREAKDOWN */}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

        <div className="mb-5">
          <h3 className="font-semibold text-white">
            Service-wise Cost Breakdown
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Aggregated AWS Cost Explorer charges by service.
          </p>
        </div>

        {serviceCosts.length === 0 ? (
          <div className="py-10 text-center">
            <DollarSign
              size={32}
              className="mx-auto text-slate-600"
            />

            <p className="mt-3 text-sm text-slate-400">
              No material service spending recorded for this period.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {serviceCosts.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.service}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className="text-blue-400"
                      />

                      <span className="text-sm text-slate-300">
                        {item.service}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {item.percentage.toFixed(1)}%
                      </span>

                      <span className="w-24 text-right text-sm font-semibold text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* SAVINGS RECOMMENDATIONS */}

      <section className="rounded-xl border border-slate-800 bg-slate-900">

        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <Lightbulb
            size={21}
            className="text-amber-400"
          />

          <div>
            <h3 className="font-semibold text-white">
              Cost Optimization Recommendations
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Practical checks to perform before optimizing AWS resources.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">

          {recommendations.map((item) => {
            const reviewed = reviewedItems.includes(item.id);

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
              >
                <div className="min-w-[220px] flex-1">

                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      {item.title}
                    </h4>

                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        item.priority === "HIGH"
                          ? "bg-red-500/10 text-red-400"
                          : item.priority === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {item.description}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Service: {item.service}
                  </p>

                </div>

                <button
                  onClick={() => markReviewed(item.id)}
                  disabled={reviewed}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    reviewed
                      ? "border border-slate-700 text-emerald-400"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {reviewed && <CheckCircle size={14} />}

                  {reviewed ? "Reviewed" : "Mark Reviewed"}
                </button>

              </div>
            );
          })}

        </div>
      </section>

      {/* DATA STATUS */}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          Source: AWS Cost Explorer · UnblendedCost · {currency}
        </p>

        <p>
          {estimatedData
            ? "Some billing records are estimated."
            : "Billing records are marked as final by AWS."}
        </p>
      </div>

    </div>
  );
}