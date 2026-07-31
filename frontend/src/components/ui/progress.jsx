import React from "react";
import { cn } from "../../lib/utils";

export function Progress({ className, value = 0, ...props }) {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800",
        className,
      )}
      {...props}
    >
      <div
        className="h-full bg-blue-600 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
