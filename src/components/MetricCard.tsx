import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconClassName?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconClassName,
}: MetricCardProps) {
  return (
    <div className="elevated-card rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {changeType === "positive" ? (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              ) : changeType === "negative" ? (
                <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            iconClassName || "bg-accent/10"
          )}
        >
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
    </div>
  );
}
