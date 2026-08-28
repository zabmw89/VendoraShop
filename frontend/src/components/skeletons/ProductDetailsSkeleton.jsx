const ProductDetailsSkeleton = () => {
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 animate-pulse">
      {
    /* Breadcrumb Navigation Skeleton */
  }
      <div className="flex items-center gap-2">
        <div className="h-4 bg-slate-200 rounded w-24" />
        <div className="h-3 w-3 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded w-20" />
        <div className="h-3 w-3 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded w-36" />
      </div>

      {
    /* Main Showcase Grid */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {
    /* Left: Gallery Skeleton */
  }
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-4/3 sm:aspect-square bg-slate-200 rounded-xl border border-slate-200 relative overflow-hidden" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="w-20 h-20 rounded-lg bg-slate-200 border border-slate-200 shrink-0" />)}
          </div>
        </div>

        {
    /* Right: Info & CTA Skeleton */
  }
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="h-5 bg-slate-200 rounded w-28" />
            <div className="h-8 bg-slate-200 rounded w-4/5" />
            <div className="flex items-center gap-3">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
          </div>

          {
    /* Pricing Box */
  }
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
            <div className="h-8 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-200 rounded w-48" />
          </div>

          {
    /* Stock availability */
  }
          <div className="h-6 bg-slate-200 rounded-full w-40" />

          {
    /* Description paragraphs */
  }
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-full" />
            <div className="h-3.5 bg-slate-200 rounded w-11/12" />
            <div className="h-3.5 bg-slate-200 rounded w-4/5" />
          </div>

          {
    /* Quantity & CTA Buttons */
  }
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="h-9 bg-slate-200 rounded-lg w-28" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="h-12 bg-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-200 rounded-lg" />
            </div>
          </div>

          {
    /* Trust Guarantees */
  }
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-5 bg-slate-200 rounded w-3/4" />)}
          </div>
        </div>
      </div>

      {
    /* Specifications Skeleton */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="h-6 bg-slate-200 rounded w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}
        </div>
      </div>

      {
    /* Reviews Section Skeleton */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-8 bg-slate-200 rounded w-24" />
        </div>
        <div className="h-36 bg-slate-100 rounded-xl" />
        <div className="space-y-4 pt-4">
          {[1, 2].map((i) => <div key={i} className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="h-4 bg-slate-200 rounded w-32" />
              <div className="h-4 bg-slate-200 rounded w-48" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>)}
        </div>
      </div>
    </div>;
};
export {
  ProductDetailsSkeleton
};
