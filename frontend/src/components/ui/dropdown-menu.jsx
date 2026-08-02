import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const value = useMemo(() => ({ open, setOpen }), [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block" ref={containerRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }) {
  const context = useContext(DropdownMenuContext);

  if (!context) return children;

  const handleClick = (event) => {
    children.props?.onClick?.(event);
    context.setOpen((current) => !current);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      "aria-expanded": context.open,
    });
  }

  return (
    <button onClick={handleClick} aria-expanded={context.open}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ className, children, align = "start" }) {
  const context = useContext(DropdownMenuContext);

  if (!context?.open) return null;

  const alignmentClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-48 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg",
        alignmentClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-medium text-gray-900 dark:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }) {
  return (
    <div
      className={cn("my-1 h-px bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
}

export function DropdownMenuItem({ className, onClick, children, ...props }) {
  const context = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        context?.setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
