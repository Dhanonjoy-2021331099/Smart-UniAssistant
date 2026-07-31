export const CATEGORIES = ["Academic", "Exam", "Assignment", "Event", "General"];

export const PRIORITIES = ["Normal", "Important", "Urgent"];

export const categoryStyles = {
  Academic: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Exam: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Assignment:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Event: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  General:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export const priorityStyles = {
  Normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Important:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Urgent: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export const statusStyles = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  published:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

export const formatNoticeDate = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
