import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  FileText,
  Users,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDashboard } from "@/lib/api";

export default function Dashboard() {
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  // -------- Stats: with conditional "newly added / urgent / recent" --------
  const stats = useMemo(() => {
    const base = [
      {
        title: "Orders Today",
        value: 0,
        icon: ClipboardList,
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
      },
      {
        title: "Pending Reports",
        value: 0,
        icon: FileText,
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
      },
      {
        title: "Completed Reports",
        value: 0,
        icon: CheckCircle,
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
      },
      {
        title: "Total Patients",
        value: 0,
        icon: Users,
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
      },
    ];

    if (!dashboard) return base;

    const {
      ordersToday,
      ordersYesterday,
      pendingReports,
      urgentPendingReports,
      completedReports,
      completedYesterday,
      totalPatients,
      newPatientsThisWeek,
    } = dashboard.stats;

    // Orders trend: compare with yesterday
    let ordersTrend: string | undefined;
    let ordersTrendUp: boolean | undefined;
    const ordersDiff = ordersToday - ordersYesterday;

    if (ordersYesterday === 0 && ordersToday > 0) {
      ordersTrend = "First orders today";
      ordersTrendUp = true;
    } else if (ordersDiff > 0) {
      ordersTrend = `+${ordersDiff} vs yesterday`;
      ordersTrendUp = true;
    } else if (ordersDiff < 0) {
      ordersTrend = `${ordersDiff} vs yesterday`;
      ordersTrendUp = false;
    }
    // If diff == 0 -> no trend text (so nothing is shown)

    // Pending reports: only show "X urgent" if > 0
    let pendingTrend: string | undefined;
    let pendingTrendUp: boolean | undefined;
    if (urgentPendingReports > 0) {
      pendingTrend = `${urgentPendingReports} urgent`;
      pendingTrendUp = false; // urgent is "bad" → show as red
    }

    // Completed reports: compare with yesterday
    let completedTrend: string | undefined;
    let completedTrendUp: boolean | undefined;
    const completedDiff = completedReports - completedYesterday;

    if (completedYesterday === 0 && completedReports > 0) {
      completedTrend = "First completed today";
      completedTrendUp = true;
    } else if (completedDiff > 0) {
      completedTrend = `+${completedDiff} vs yesterday`;
      completedTrendUp = true;
    } else if (completedDiff < 0) {
      completedTrend = `${completedDiff} vs yesterday`;
      completedTrendUp = false;
    }

    // Total patients: only show "newly added" if > 0
    let patientsTrend: string | undefined;
    let patientsTrendUp: boolean | undefined;
    if (newPatientsThisWeek > 0) {
      patientsTrend = `+${newPatientsThisWeek} this week`;
      patientsTrendUp = true;
    }

    return [
      {
        title: "Orders Today",
        value: ordersToday,
        icon: ClipboardList,
        trend: ordersTrend,
        trendUp: ordersTrendUp,
      },
      {
        title: "Pending Reports",
        value: pendingReports,
        icon: FileText,
        trend: pendingTrend,          // e.g. "3 urgent"
        trendUp: pendingTrendUp,
      },
      {
        title: "Completed Reports",
        value: completedReports,
        icon: CheckCircle,
        trend: completedTrend,        // e.g. "+2 vs yesterday"
        trendUp: completedTrendUp,
      },
      {
        title: "Total Patients",
        value: totalPatients,
        icon: Users,
        trend: patientsTrend,         // e.g. "+5 this week"
        trendUp: patientsTrendUp,
      },
    ];
  }, [dashboard]);

  // -------- Orders overview chart (last 7 days) --------
  const ordersChartData = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.ordersLast7Days.map((item) => {
      const label = new Date(item.date).toLocaleDateString(undefined, {
        weekday: "short",
      });
      return { label, count: item.count };
    });
  }, [dashboard]);

  const maxCount =
    ordersChartData.length > 0
      ? Math.max(...ordersChartData.map((d) => d.count), 1)
      : 1;

  // Quick links + recent activity (still static for now)
  const quickLinks = [
    {
      title: "New Test Order",
      description: "Create a new test order for a patient",
      to: "/orders/new",
      icon: ClipboardList,
    },
    {
      title: "View Orders",
      description: "See all pending and completed orders",
      to: "/orders",
      icon: FileText,
    },
    {
      title: "Patient List",
      description: "View and manage patient records",
      to: "/patients",
      icon: Users,
    },
    {
      title: "SQL Demo",
      description: "Run SQL queries for demonstration",
      to: "/sql-demo",
      icon: TrendingUp,
    },
  ];

  const recentActivity = [
    {
      action: "Test order created",
      patient: "John Doe",
      time: "10 minutes ago",
      type: "order",
    },
    {
      action: "Results entered",
      patient: "Jane Smith",
      time: "25 minutes ago",
      type: "result",
    },
    {
      action: "Report generated",
      patient: "Robert Johnson",
      time: "1 hour ago",
      type: "report",
    },
    {
      action: "New patient added",
      patient: "Emily Davis",
      time: "2 hours ago",
      type: "patient",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to MedLAB+ Digital Lab System
        </p>
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">
              Failed to load dashboard data:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={isLoading ? "…" : stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendUp={stat.trendUp}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary hover:bg-accent transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {link.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in the lab system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-4 border-b last:border-0"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      activity.type === "order"
                        ? "bg-status-in-progress/10"
                        : activity.type === "result"
                        ? "bg-status-pending/10"
                        : activity.type === "report"
                        ? "bg-status-completed/10"
                        : "bg-primary/10"
                    }`}
                  >
                    {activity.type === "order" && (
                      <ClipboardList className="h-4 w-4 text-status-in-progress" />
                    )}
                    {activity.type === "result" && (
                      <FileText className="h-4 w-4 text-status-pending" />
                    )}
                    {activity.type === "report" && (
                      <CheckCircle className="h-4 w-4 text-status-completed" />
                    )}
                    {activity.type === "patient" && (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.patient}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders Overview - Last 7 Days</CardTitle>
          <CardDescription>Daily test order statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersChartData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading chart data..."
                : "No orders recorded in the last 7 days."}
            </p>
          )}
          {ordersChartData.length > 0 && (
            <div className="h-64 flex items-end justify-around gap-4">
              {ordersChartData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className="w-full bg-primary/20 rounded-t-lg relative"
                    style={{
                      height: `${(item.count / maxCount) * 100 || 0}%`,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 bg-primary rounded-t-lg"
                      style={{ height: "100%" }}
                    ></div>
                    <div className="absolute -top-6 left-0 right-0 text-center text-sm font-semibold text-foreground">
                      {item.count}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
