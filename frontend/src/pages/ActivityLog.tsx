import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityLogItem, fetchActivity } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString();
}

export default function ActivityLog() {
  const {
    data: activity,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["activity"],
    queryFn: () => fetchActivity(100),
  });

  const getActionColor = (action: string) => {
    if (action.startsWith("CREATE_")) return "bg-primary/10 text-primary";
    if (action.includes("REPORT")) return "bg-status-completed/10 text-status-completed";
    if (action.includes("RESULT")) return "bg-status-pending/10 text-status-pending";
    return "bg-muted text-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of important actions in the lab system
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading activity..."
              : `Showing ${activity?.length ?? 0} event(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive mb-4">
              Failed to load activity:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading &&
                (activity ?? []).map((item: ActivityLogItem) => (
                  <TableRow key={item.log_id}>
                    <TableCell className="text-sm">
                      {formatDateTime(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-medium ${getActionColor(
                          item.action
                        )}`}
                      >
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.entity_type}
                      {item.entity_id != null && ` #${item.entity_id}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.description ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (activity ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm">
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
