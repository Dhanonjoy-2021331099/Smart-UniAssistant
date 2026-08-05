import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parseValue = (value) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const toInputValue = (date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const startOfDay = (date) =>
  date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;

const isSameDay = (first, second) =>
  Boolean(
    first &&
      second &&
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate(),
  );

const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  className,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = parseValue(value);
  const min = startOfDay(parseValue(minDate));
  const max = startOfDay(parseValue(maxDate));

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [viewMonth]);

  const canGoPrevious =
    !min ||
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1) >=
      new Date(min.getFullYear(), min.getMonth(), 1);

  const canGoNext =
    !max ||
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) <=
      new Date(max.getFullYear(), max.getMonth(), 1);

  const handleSelect = (date) => {
    onChange(toInputValue(date));
    setOpen(false);
  };

  const isDisabled = (date) =>
    (min && date < min) || (max && date > max);

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-left text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays className="w-4 h-4 mr-2 shrink-0 text-gray-400" />
        {selected ? (
          selected.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 max-w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() - 1,
                      1,
                    ),
                )
              }
              disabled={!canGoPrevious}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() + 1,
                      1,
                    ),
                )
              }
              disabled={!canGoNext}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                className="text-xs font-medium text-gray-400 py-1"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} />;
              }

              const disabled = isDisabled(date);
              const today = isSameDay(date, new Date());

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => !disabled && handleSelect(date)}
                  disabled={disabled}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm flex items-center justify-center transition-colors",
                    isSameDay(date, selected)
                      ? "bg-blue-600 text-white font-medium"
                      : today
                        ? "text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                    disabled && "opacity-30 cursor-not-allowed",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
