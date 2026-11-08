import { useState } from "react";
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
} from "lucide-react";

const initialCosts = [
  { service: "EC2", amount: 86.40, percentage: 36, icon: Server },
  { service: "RDS", amount: 64.20, percentage: 27, icon: Database },
  { service: "S3", amount: 32.80, percentage: 14, icon: HardDrive },
  { service: "Lambda", amount: 18.50, percentage: 8, icon: Server },
  { service: "CloudWatch", amount: 15.60, percentage: 7, icon: TrendingUp },
  { service: "Other Services", amount: 19.70, percentage: 8, icon: DollarSign },
];

const initialRecommendations = [
  {
    id: 1,
    title: "Review underutilized EC2 instances",
    description:
      "Identify instances with consistently low CPU utilization and consider smaller instance types.",
    service: "EC2",
    savings: 28.50,
    priority: "HIGH",
    status: "PENDING",
  },
  {
    id: 2,
    title: "Enable S3 lifecycle policies",
    description:
      "Move infrequently accessed objects to lower-cost storage classes.",
    service: "S3",
    savings: 12.40,
    priority: "MEDIUM",
    status: "PENDING",
  },
  {
    id: 3,
    title: "Review RDS instance sizing",
    description:
      "Check database utilization and evaluate whether a smaller instance is sufficient.",
    service: "RDS",
    savings: 22.00,
    priority: "HIGH",
    status: "PENDING",
  },
  {
    id: 4,
    title: "Review CloudWatch log retention",
    description:
      "Set appropriate retention periods for log groups to reduce storage costs.",
    service: "CloudWatch",
    savings: 6.80,
    priority: "LOW",
    status: "PENDING",
  },
];

export default function CostOptimizationPage() {
  const [costs] = useState(initialCosts);
  const [recommendations, setRecommendations] = useState(
    initialRecommendations
  );
  const [budget, setBudget] = useState(300);
  const [budgetInput, setBudgetInput] = useState("300");

  const totalCost = costs.reduce(
    (total, item) => total + item.amount,
    0
  );

  const potentialSavings = recommendations
    .filter((item) => item.status === "PENDING")
    .reduce((total, item) => total + item.savings, 0);

  const budgetUsage = (totalCost / budget) * 100;

  const markReviewed = (id) => {
    setRecommendations((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: "REVIEWED" }
          : item
      )
    );
  };

  const resetData = () => {
    setRecommendations(initialRecommendations);
    setBudget(300);
    setBudgetInput("300");
  };

  const updateBudget = (event) => {
    event.preventDefault();
    const value = Number(budgetInput);

    if (Number.isFinite(value) && value > 0) {
      setBudget(value);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Cost Optimization
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Track cloud spending and identify opportunities to reduce costs.
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
            title: "Estimated Monthly Cost",
            value: `$${totalCost.toFixed(2)}`,
            icon: DollarSign,
            color: "text-blue-400",
          },
          {
            title: "Monthly Budget",
            value: `$${budget.toFixed(2)}`,
            icon: PiggyBank,
            color: "text-purple-400",
          },
          {
            title: "Potential Savings",
            value: `$${potentialSavings.toFixed(2)}`,
            icon: TrendingDown,
            color: "text-emerald-400",
          },
          {
            title: "Budget Utilization",
            value: `${budgetUsage.toFixed(1)}%`,
            icon: TrendingUp,
            color: budgetUsage > 100
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

      {/* BUDGET TRACKING */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">
              Monthly Budget Tracking
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Estimated spending compared with your configured budget.
            </p>
          </div>

          <form onSubmit={updateBudget} className="flex gap-2">
            <span className="flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-400">
              $
            </span>

            <input
              type="number"
              min="1"
              step="1"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
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
          <span className="text-slate-400">Budget consumed</span>
          <span className="font-semibold text-white">
            ${totalCost.toFixed(2)} / ${budget.toFixed(2)}
          </span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              budgetUsage > 100 ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {budgetUsage > 100
            ? "Budget exceeded. Review your cloud spending."
            : `${(100 - budgetUsage).toFixed(1)}% of your budget remains.`}
        </p>

      </section>

      {/* SERVICE COST BREAKDOWN */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

        <div className="mb-5">
          <h3 className="font-semibold text-white">
            Service-wise Cost Breakdown
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Simulated monthly spending by AWS service.
          </p>
        </div>

        <div className="space-y-5">

          {costs.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.service}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={17} className="text-blue-400" />
                    <span className="text-sm text-slate-300">
                      {item.service}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {item.percentage}%
                    </span>
                    <span className="w-20 text-right text-sm font-semibold text-white">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

        </div>
      </section>

      {/* SAVINGS RECOMMENDATIONS */}
      <section className="rounded-xl border border-slate-800 bg-slate-900">

        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <Lightbulb size={21} className="text-amber-400" />

          <div>
            <h3 className="font-semibold text-white">
              Cost Savings Recommendations
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Review potential optimization opportunities.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">

          {recommendations.map((item) => (
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

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Potential savings
                  </p>
                  <p className="mt-1 font-semibold text-emerald-400">
                    ${item.savings.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => markReviewed(item.id)}
                  disabled={item.status === "REVIEWED"}
                  className={`rounded-lg px-3 py-2 text-xs ${
                    item.status === "REVIEWED"
                      ? "border border-slate-700 text-slate-500"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {item.status === "REVIEWED"
                    ? "Reviewed"
                    : "Mark Reviewed"}
                </button>
              </div>
            </div>
          ))}

        </div>
      </section>

      <p className="text-xs text-slate-500">
        Demo environment · Simulated cost data · No live AWS billing connection.
        Savings are estimates, not guaranteed reductions.
      </p>

    </div>
  );
}