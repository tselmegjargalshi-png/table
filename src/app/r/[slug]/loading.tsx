import { Skeleton } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" aria-busy="true" aria-label="Меню ачаалж байна">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="mt-6 h-10 w-full" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[128px] w-full" />
        ))}
      </div>
    </div>
  );
}
