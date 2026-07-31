import React from "react";
import { cn } from "../../lib/utils";

export function Avatar({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({ className, alt = "", ...props }) {
  return (
    <img
      className={cn("h-full w-full object-cover", className)}
      alt={alt}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300",
        className,
      )}
      {...props}
    />
  );
}
