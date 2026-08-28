import { ProductGridSkeleton } from "./ProductGridSkeleton";
const HomePageSkeleton = () => {
  return <div className="space-y-8 animate-pulse" id="homepage-skeleton">
      {
    /* Hero Banner Skeleton */
  }
      <div className="relative rounded-2xl bg-linear-to-r from-slate-200 via-slate-150 to-slate-200 p-8 sm:p-12 overflow-hidden border border-slate-200">
        <div className="max-w-2xl space-y-4">
          <div className="h-6 w-36 bg-slate-300 rounded-full" />
          <div className="h-10 sm:h-12 w-3/4 bg-slate-300 rounded-xl" />
          <div className="h-4 w-full bg-slate-300/80 rounded" />
          <div className="h-4 w-2/3 bg-slate-300/80 rounded" />
          <div className="pt-4 flex items-center gap-3">
            <div className="h-11 w-36 bg-slate-300 rounded-xl" />
            <div className="h-11 w-44 bg-slate-300/70 rounded-xl" />
          </div>
        </div>
      </div>

      {
    /* Category Pills Bar Skeleton */
  }
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="h-9 w-24 bg-slate-200 rounded-full shrink-0" />
        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 w-32 bg-slate-200 rounded-full shrink-0" />)}
      </div>

      {
    /* Main Content Layout: Sidebar Filters + Products Grid */
  }
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {
    /* Filter Sidebar Skeleton */
  }
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6 shadow-xs">
            {
    /* Filter Header */
  }
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="h-5 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-12 bg-slate-200 rounded" />
            </div>

            {
    /* Price Tiers Skeleton */
  }
            <div className="space-y-3">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-7 w-full bg-slate-100 rounded-lg" />)}
              </div>
            </div>

            {
    /* Brands Skeleton */
  }
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <div className="h-8 w-full bg-slate-100 rounded-lg" />
              <div className="space-y-2 pt-1">
                {[1, 2, 3, 4].map((i) => <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-slate-200 rounded" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>)}
              </div>
            </div>

            {
    /* Ratings Skeleton */
  }
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-6 w-full bg-slate-100 rounded-md" />)}
              </div>
            </div>
          </div>
        </div>

        {
    /* Product Grid Area Skeleton */
  }
        <div className="lg:col-span-3 space-y-6">
          {
    /* Top Toolbar */
  }
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-36 bg-slate-100 rounded-lg" />
              <div className="h-8 w-18 bg-slate-100 rounded-lg" />
            </div>
          </div>

          {
    /* Product Cards Grid */
  }
          <ProductGridSkeleton count={6} viewMode="grid" />
        </div>
      </div>
    </div>;
};
export {
  HomePageSkeleton
};
