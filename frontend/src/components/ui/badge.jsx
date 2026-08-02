import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-blue-600 text-white",
  secondary: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
  outline:
    "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300",
  destructive: "bg-red-600 text-white",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
