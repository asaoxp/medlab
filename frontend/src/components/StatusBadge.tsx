import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "pending" | "in-progress" | "completed" | "urgent" | "normal";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const variants: Record<StatusType, string> = {
    pending: "bg-status-pending text-status-pending-foreground",
    "in-progress": "bg-status-in-progress text-status-in-progress-foreground",
    completed: "bg-status-completed text-status-completed-foreground",
    urgent: "bg-status-urgent text-status-urgent-foreground",
    normal: "bg-muted text-muted-foreground",
  };

  return (
    <Badge className={cn("font-medium", variants[status])}>
      {children}
    </Badge>
  );
}
