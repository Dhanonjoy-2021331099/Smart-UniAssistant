import { useInfiniteQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "../../components/ui/button";
import NoticeCard from "../../components/notices/NoticeCard";
import { fetchNotices, getNoticeBasePath } from "../../services/notice.service";

const PAGE_SIZE = 12;

const CardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
    <div className="h-5 w-2/3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
    <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
    <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
    <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
  </div>
);

const StudentNotices = () => {
  const basePath = getNoticeBasePath("student");

  const {
    data,
    isPending: loading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["student-notices"],
    queryFn: ({ pageParam = 1 }) =>
      fetchNotices({ status: "published", page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.page < lastPage?.pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  const notices = data?.pages?.flatMap((page) => page.notices || []) || [];

  return (
    <div className="space-y-6" data-testid="student-notices-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notices
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest announcements and updates from your CR and teachers
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error?.response?.data?.error || error?.message || "Failed to load notices"}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : notices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No notices yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Check back later for new announcements.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {notices.map((notice) => (
              <NoticeCard
                key={notice._id}
                notice={notice}
                detailsPath={`${basePath}/${notice._id}`}
                compact
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentNotices;
